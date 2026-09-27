-- Function: fn_create_initial_book_copies
CREATE OR REPLACE FUNCTION fn_create_initial_book_copies()
    RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    i integer;
BEGIN
    IF NEW.initial_stock IS NOT NULL AND NEW.initial_stock > 0 THEN
        FOR i IN 1..NEW.initial_stock LOOP
            INSERT INTO book_copy (book_id, status, condition)
            VALUES (NEW.id, 'in_stock', 'new');
        END LOOP;
    END IF;

    -- Nullify the carrier column so it doesn't show up in queries
    UPDATE books SET initial_stock = NULL WHERE id = NEW.id;

    RETURN NEW;
END;
$$;

-- Trigger: trg_create_initial_book_copies
CREATE OR REPLACE TRIGGER trg_create_initial_book_copies
    AFTER INSERT
    ON books
    FOR EACH ROW
    EXECUTE FUNCTION fn_create_initial_book_copies();





-- Trigger: trg_sync_book_availability
CREATE OR REPLACE TRIGGER trg_sync_book_availability
    AFTER INSERT OR DELETE OR UPDATE OF status
    ON book_copy
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_book_availability();




-- Function: fn_sync_book_availability
CREATE OR REPLACE FUNCTION fn_sync_book_availability()
    RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_book_id bigint;
    v_stock_cnt integer;
BEGIN
    -- Determine which book_id changed
    IF TG_OP = 'DELETE' THEN
        v_book_id := OLD.book_id;
    ELSE
        v_book_id := NEW.book_id;
    END IF;

    -- Count remaining in_stock copies
    SELECT COUNT(*) INTO v_stock_cnt
    FROM book_copy
    WHERE book_id = v_book_id AND status = 'in_stock';

    -- Only flip between In Stock / Out of Stock.
    -- Leave Pre-Order books alone.
    UPDATE books
    SET availability =
        CASE
            WHEN v_stock_cnt > 0 THEN 'In Stock'
            ELSE 'Out of Stock'
        END
    WHERE id = v_book_id
      AND availability <> 'Pre-Order';   -- don't override Pre-Order

    RETURN NEW;
END;
$$;
