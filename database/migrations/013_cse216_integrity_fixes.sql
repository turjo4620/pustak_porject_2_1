BEGIN;

CREATE SEQUENCE IF NOT EXISTS users_user_id_seq;
ALTER SEQUENCE users_user_id_seq OWNED BY users.user_id;
ALTER TABLE users
  ALTER COLUMN user_id SET DEFAULT nextval('users_user_id_seq'::regclass);
SELECT setval(
  'users_user_id_seq',
  GREATEST(COALESCE((SELECT MAX(user_id) FROM users), 0) + 1, 1),
  false
);

ALTER TABLE "return"
  ADD CONSTRAINT return_order_item_id_key UNIQUE (order_item_id);

COMMIT;
