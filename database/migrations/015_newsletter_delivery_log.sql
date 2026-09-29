BEGIN;

CREATE TABLE IF NOT EXISTS newsletter_delivery_log
(
    delivery_id bigserial NOT NULL,
    user_id bigint,
    email varchar(255) NOT NULL,
    subject varchar(255) NOT NULL,
    status varchar(20) NOT NULL,
    error_message text,
    sent_at timestamp,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT newsletter_delivery_log_pkey PRIMARY KEY (delivery_id),
    CONSTRAINT newsletter_delivery_log_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL,
    CONSTRAINT newsletter_delivery_log_status_check CHECK (status IN ('sent', 'failed'))
);

COMMIT;
