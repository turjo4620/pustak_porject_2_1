BEGIN;

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
