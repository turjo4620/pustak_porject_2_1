BEGIN;

CREATE TABLE IF NOT EXISTS user_status_audit (
    audit_id bigserial PRIMARY KEY,
    user_id bigint NOT NULL,
    old_status varchar(50),
    new_status varchar(50) NOT NULL,
    changed_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION fn_log_user_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO user_status_audit (user_id, old_status, new_status)
        VALUES (NEW.user_id, OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_user_status_change ON users;
CREATE TRIGGER trg_log_user_status_change
AFTER UPDATE OF status ON users
FOR EACH ROW
EXECUTE FUNCTION fn_log_user_status_change();

CREATE OR REPLACE FUNCTION fn_sales_summary(
    p_start_date timestamp,
    p_end_date timestamp
)
RETURNS TABLE (
    total_orders bigint,
    total_revenue numeric,
    average_order_value numeric
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        COUNT(*)::bigint,
        COALESCE(SUM(o.total_amount), 0)::numeric,
        COALESCE(AVG(o.total_amount), 0)::numeric
    FROM orders o
    WHERE o.order_date >= p_start_date
      AND o.order_date <= p_end_date
      AND o.status NOT IN ('Cancelled', 'Returned');
$$;

DROP PROCEDURE IF EXISTS sp_approve_return(bigint);
CREATE OR REPLACE PROCEDURE sp_approve_return(p_return_id bigint)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_item_id bigint;
    v_copy_id bigint;
    v_price_sold numeric(10, 2);
    v_status varchar(50);
BEGIN
    SELECT r.order_item_id, r.status, oi.copy_id, oi.price_sold
      INTO v_order_item_id, v_status, v_copy_id, v_price_sold
    FROM "return" r
    JOIN order_item oi ON oi.order_item_id = r.order_item_id
    WHERE r.return_id = p_return_id
    FOR UPDATE OF r;

    IF v_order_item_id IS NULL THEN
        RAISE EXCEPTION 'Return request % was not found', p_return_id
            USING ERRCODE = 'P0002';
    END IF;

    IF v_status <> 'initiated' THEN
        RAISE EXCEPTION 'Return request % is already %', p_return_id, v_status
            USING ERRCODE = 'P0001';
    END IF;

    UPDATE "return"
       SET status = 'approved', approved_at = CURRENT_TIMESTAMP
     WHERE return_id = p_return_id;

    INSERT INTO refund (return_id, refund_amount, refund_status)
    VALUES (p_return_id, v_price_sold, 'Pending')
    ON CONFLICT (return_id) DO NOTHING;

    UPDATE book_copy
       SET status = 'in_stock'
     WHERE copy_id = v_copy_id;
END;
$$;

COMMIT;
