CREATE TABLE IF NOT EXISTS users
(
    user_id bigint NOT NULL,
    name varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    phone_number varchar(20),
    password_hash varchar(255) NOT NULL,
    role varchar(50) NOT NULL DEFAULT 'customer',
    status varchar(50) NOT NULL DEFAULT 'Active',
    last_login timestamp without time zone,
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_email_key UNIQUE (email)
);


-- Table: wishlist
CREATE TABLE IF NOT EXISTS wishlist
(
wishlist_id serial NOT NULL,
user_id bigint NOT NULL,
created_at timestamp NOT NULL DEFAULT now(),
CONSTRAINT wishlist_pkey PRIMARY KEY (wishlist_id),
CONSTRAINT wishlist_user_id_key UNIQUE (user_id),
CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id)
REFERENCES users (user_id)
ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS wishlist_item
(
    wishlist_item_id serial NOT NULL,
    wishlist_id integer NOT NULL,
    book_id integer NOT NULL,
    added_at timestamp NOT NULL DEFAULT now(),
    CONSTRAINT wishlist_item_pkey PRIMARY KEY (wishlist_item_id),
    CONSTRAINT wishlist_item_wishlist_id_book_id_key UNIQUE (wishlist_id, book_id),
    CONSTRAINT wishlist_item_book_id_fkey FOREIGN KEY (book_id)
        REFERENCES public.books (id)
        ON DELETE CASCADE,
    CONSTRAINT wishlist_item_wishlist_id_fkey FOREIGN KEY (wishlist_id)
        REFERENCES public.wishlist (wishlist_id)
        ON DELETE CASCADE
);





-- Table: reviews
CREATE TABLE IF NOT EXISTS reviews
(
review_id serial NOT NULL,
user_id bigint NOT NULL,
book_id integer NOT NULL,
rating integer,
comment text,
is_hidden boolean NOT NULL DEFAULT false,
review_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT reviews_pkey PRIMARY KEY (review_id),
CONSTRAINT reviews_book_id_fkey FOREIGN KEY (book_id)
REFERENCES books (id)
ON DELETE CASCADE,
CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id)
REFERENCES users (user_id)
ON DELETE CASCADE,
CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5)
);


-- Table: return
CREATE TABLE IF NOT EXISTS "return"
(
return_id bigserial NOT NULL,
order_item_id bigint NOT NULL,
reason varchar(255),
return_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
status varchar(50) NOT NULL DEFAULT 'initiated',
approved_at timestamp,
CONSTRAINT return_pkey PRIMARY KEY (return_id),
CONSTRAINT return_order_item_id_fkey FOREIGN KEY (order_item_id)
REFERENCES order_item (order_item_id)
);



-- Table: refund
CREATE TABLE IF NOT EXISTS refund
(
refund_id bigserial NOT NULL,
return_id bigint NOT NULL,
refund_amount numeric(10,2) NOT NULL,
refund_date timestamp,
refund_status varchar(50),
CONSTRAINT refund_pkey PRIMARY KEY (refund_id),
CONSTRAINT refund_return_id_key UNIQUE (return_id),
CONSTRAINT refund_return_id_fkey FOREIGN KEY (return_id)
REFERENCES "return" (return_id)
);


-- Table: publications
CREATE TABLE IF NOT EXISTS publications
(
publication_id serial NOT NULL,
title varchar(150) NOT NULL,
bio text,
cover_image_url varchar(255),
CONSTRAINT publications_pkey PRIMARY KEY (publication_id)
);


-- Table: payments
CREATE TABLE IF NOT EXISTS payments
(
payment_id serial NOT NULL,
order_id integer NOT NULL,
amount numeric(10,2) NOT NULL,
payment_date timestamp DEFAULT CURRENT_TIMESTAMP,
payment_status varchar(50) DEFAULT 'Pending',
CONSTRAINT payments_pkey PRIMARY KEY (payment_id),
CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id)
REFERENCES orders (order_id)
ON DELETE CASCADE
);


-- Table: orders
CREATE TABLE IF NOT EXISTS orders
(
order_id serial NOT NULL,
user_id bigint NOT NULL,
address_id integer,
coupon_id integer,
order_number varchar(50) NOT NULL,
total_amount numeric(10,2) NOT NULL,
order_date timestamp DEFAULT CURRENT_TIMESTAMP,
status varchar(50) DEFAULT 'Pending',
CONSTRAINT orders_pkey PRIMARY KEY (order_id),
CONSTRAINT orders_order_number_key UNIQUE (order_number),
CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id)
REFERENCES users (user_id)
ON DELETE RESTRICT,
CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id)
REFERENCES addresses (address_id),
CONSTRAINT orders_coupon_id_fkey FOREIGN KEY (coupon_id)
REFERENCES coupons (coupon_id)
);


-- Table: order_item
CREATE TABLE IF NOT EXISTS order_item
(
order_item_id bigserial NOT NULL,
order_id integer NOT NULL,
copy_id bigint NOT NULL,
price_sold numeric(10,2) NOT NULL,
CONSTRAINT order_item_pkey PRIMARY KEY (order_item_id),
CONSTRAINT order_item_copy_id_fkey FOREIGN KEY (copy_id)
REFERENCES book_copy (copy_id),
CONSTRAINT order_item_order_id_fkey FOREIGN KEY (order_id)
REFERENCES orders (order_id)
);



-- Table: mfs_payments
CREATE TABLE IF NOT EXISTS mfs_payments
(
payment_id integer NOT NULL,
sender_mobile_no varchar(20),
provider_name varchar(50),
CONSTRAINT mfs_payments_pkey PRIMARY KEY (payment_id),
CONSTRAINT mfs_payments_payment_id_fkey FOREIGN KEY (payment_id)
REFERENCES payments (payment_id)
ON DELETE CASCADE
);



-- Table: deliveries
CREATE TABLE IF NOT EXISTS deliveries
(
delivery_id serial NOT NULL,
order_id integer NOT NULL,
tracking_no varchar(100),
dispatch_date timestamp,
est_date timestamp,
delivered_at timestamp,
status varchar(50),
courier_id integer,
delivery_charge integer,
CONSTRAINT deliveries_pkey PRIMARY KEY (delivery_id),
CONSTRAINT deliveries_courier_id_fkey FOREIGN KEY (courier_id)
REFERENCES courier (courier_id),
CONSTRAINT deliveries_order_id_fkey FOREIGN KEY (order_id)
REFERENCES orders (order_id)
ON DELETE CASCADE
);



-- Table: customer
CREATE TABLE IF NOT EXISTS customer
(
user_id bigint NOT NULL,
newsletter_opt_in boolean DEFAULT false,
CONSTRAINT customer_pkey PRIMARY KEY (user_id),
CONSTRAINT customer_user_id_fkey FOREIGN KEY (user_id)
REFERENCES users (user_id)
ON DELETE CASCADE
);




-- Table: courier
CREATE TABLE IF NOT EXISTS courier
(
courier_id serial NOT NULL,
name varchar(100) NOT NULL,
CONSTRAINT courier_pkey PRIMARY KEY (courier_id),
CONSTRAINT courier_name_key UNIQUE (name)
);


-- Table: coupons
CREATE TABLE IF NOT EXISTS coupons
(
coupon_id serial NOT NULL,
code varchar(50) NOT NULL,
description text,
discount_value numeric(10,2) NOT NULL,
status varchar(20) DEFAULT 'Active',
usage_limit integer,
min_order_amount numeric(10,2),
max_order_amount numeric(10,2),
start_date timestamp,
end_date timestamp,
CONSTRAINT coupons_pkey PRIMARY KEY (coupon_id),
CONSTRAINT coupons_code_key UNIQUE (code)
);



-- Table: categories
CREATE TABLE IF NOT EXISTS categories
(
category_id serial NOT NULL,
category_name varchar(100) NOT NULL,
CONSTRAINT categories_pkey PRIMARY KEY (category_id),
CONSTRAINT category_name_unique UNIQUE (category_name)
);



-- Table: cash_on_deliveries
CREATE TABLE IF NOT EXISTS cash_on_deliveries
(
payment_id integer NOT NULL,
collected_by varchar(100),
collection_date timestamp,
CONSTRAINT cash_on_deliveries_pkey PRIMARY KEY (payment_id),
CONSTRAINT cash_on_deliveries_payment_id_fkey FOREIGN KEY (payment_id)
REFERENCES payments (payment_id)
ON DELETE CASCADE
);

-- Table: cart_item
CREATE TABLE IF NOT EXISTS cart_item
(
    cart_item_id bigserial NOT NULL,
    cart_id bigint NOT NULL,
    book_id integer NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    CONSTRAINT cart_item_pkey PRIMARY KEY (cart_item_id),
    CONSTRAINT cart_item_cart_id_book_id_key UNIQUE (cart_id, book_id),
    CONSTRAINT cart_item_book_id_fkey FOREIGN KEY (book_id)
        REFERENCES books (id)
        ON DELETE CASCADE,
    CONSTRAINT cart_item_cart_id_fkey FOREIGN KEY (cart_id)
        REFERENCES cart (cart_id)
        ON DELETE CASCADE,
    CONSTRAINT cart_item_quantity_check CHECK (quantity > 0)
);

-- Index: idx_cart_item_cart_id
CREATE INDEX IF NOT EXISTS idx_cart_item_cart_id
    ON cart_item (cart_id);



    -- Table: cart
CREATE TABLE IF NOT EXISTS cart
(
cart_id bigserial NOT NULL,
user_id bigint NOT NULL,
status varchar(50) NOT NULL DEFAULT 'active',
created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT cart_pkey PRIMARY KEY (cart_id),
CONSTRAINT cart_user_id_key UNIQUE (user_id),
CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id)
REFERENCES users (user_id)
ON DELETE CASCADE
);



-- Table: card_payments
CREATE TABLE IF NOT EXISTS card_payments
(
    payment_id integer NOT NULL,
    card_last_4_digits char(4),
    bank_name varchar(100),
    card_brand varchar(50),
    CONSTRAINT card_payments_pkey PRIMARY KEY (payment_id),
    CONSTRAINT card_payments_payment_id_fkey FOREIGN KEY (payment_id)
        REFERENCES payments (payment_id)
        ON DELETE CASCADE
);



-- Table: books
CREATE TABLE IF NOT EXISTS books
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
    book_name varchar(300) NOT NULL,
    cover_image_url text,
    isbn varchar(20),
    language varchar(50),
    num_pages integer,
    edition varchar(100),
    price numeric(10,2),
    rating numeric(4,2),
    num_reviews integer,
    availability varchar(30),
    description text,
    initial_stock integer DEFAULT 0,
    publication_id integer,
    discount_percentage integer DEFAULT 0,
    admin_id bigint DEFAULT 1786484073,
    CONSTRAINT books_pkey PRIMARY KEY (id),
    CONSTRAINT books_publication_id_fkey FOREIGN KEY (publication_id)
        REFERENCES publications (publication_id),
    CONSTRAINT fk_books_admin FOREIGN KEY (admin_id)
        REFERENCES admin (user_id)
);







    -- Table: book_copy
CREATE TABLE IF NOT EXISTS book_copy
(
    copy_id bigserial NOT NULL,
    book_id integer NOT NULL,
    status varchar(50) NOT NULL DEFAULT 'in_stock',
    condition varchar(50) NOT NULL DEFAULT 'new',
    barcode varchar(100),
    CONSTRAINT book_copy_pkey PRIMARY KEY (copy_id),
    CONSTRAINT book_copy_barcode_key UNIQUE (barcode),
    CONSTRAINT book_copy_book_id_fkey FOREIGN KEY (book_id)
        REFERENCES books (id)
);




    -- Table: book_category
CREATE TABLE IF NOT EXISTS book_category
(
    book_id integer NOT NULL,
    category_id integer NOT NULL,
    CONSTRAINT book_category_pkey PRIMARY KEY (book_id, category_id),
    CONSTRAINT book_category_book_id_fkey FOREIGN KEY (book_id)
        REFERENCES books (id)
        ON DELETE CASCADE,
    CONSTRAINT book_category_category_id_fkey FOREIGN KEY (category_id)
        REFERENCES categories (category_id)
        ON DELETE CASCADE
);



-- Table: book_author
CREATE TABLE IF NOT EXISTS book_author
(
    book_id integer NOT NULL,
    author_id integer NOT NULL,
    CONSTRAINT book_author_pkey PRIMARY KEY (book_id, author_id),
    CONSTRAINT fk_book_author_author FOREIGN KEY (author_id)
        REFERENCES authors (author_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_book_author_book FOREIGN KEY (book_id)
        REFERENCES books (id)
        ON DELETE CASCADE
);




-- Table: authors
CREATE TABLE IF NOT EXISTS authors
(
    author_id serial NOT NULL,
    name varchar(150) NOT NULL,
    bio text,
    photo_url varchar(255),
    CONSTRAINT authors_pkey PRIMARY KEY (author_id)
);

-- Alternate spellings (including translated names) resolve to one author.
CREATE TABLE IF NOT EXISTS author_aliases
(
    alias_name varchar(150) NOT NULL,
    author_id integer NOT NULL,
    CONSTRAINT author_aliases_pkey PRIMARY KEY (alias_name),
    CONSTRAINT author_aliases_author_id_fkey FOREIGN KEY (author_id)
        REFERENCES authors (author_id)
        ON DELETE CASCADE
);



-- Table: admin
CREATE TABLE IF NOT EXISTS admin
(
    user_id bigint NOT NULL,
    admin_level varchar(50),
    department varchar(100),
    CONSTRAINT admin_pkey PRIMARY KEY (user_id),
    CONSTRAINT admin_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
);



-- Table: addresses
CREATE TABLE IF NOT EXISTS addresses
(
    address_id serial NOT NULL,
    user_id bigint NOT NULL,
    street varchar(255),
    area varchar(100),
    district varchar(100),
    division varchar(100),
    postal_code varchar(20),
    is_default boolean DEFAULT false,
    CONSTRAINT addresses_pkey PRIMARY KEY (address_id),
    CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
);