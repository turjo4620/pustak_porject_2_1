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

COMMIT;
