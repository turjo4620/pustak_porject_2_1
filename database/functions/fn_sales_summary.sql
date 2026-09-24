BEGIN;

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

COMMIT;
