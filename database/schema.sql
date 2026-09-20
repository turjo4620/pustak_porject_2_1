CREATE TABLE books (
    id                   INT PRIMARY KEY,
    book_name            VARCHAR(300) NOT NULL,
    cover_image_url      TEXT,
    isbn                 VARCHAR(20),
    language             VARCHAR(50),
    num_pages            INTEGER,
    edition              VARCHAR(100),
    price                NUMERIC(10, 2),
    discount_price       NUMERIC(10, 2),
    rating               NUMERIC(4, 2),
    num_reviews          INTEGER,
    availability         VARCHAR(30),
    description          TEXT
);

-- select * from book_copy;
-- ALTER table deliveries 
-- add column delivery_charge INT

alter table deliveries
drop column delivered_via
-- ALTER TABLE books
-- ALTER COLUMN edition TYPE VARCHAR(20);
select* from books;
-- ALTER TABLE books
-- ALTER COLUMN format TYPE CHAR(20)

-- -- ALTER TABLE books
-- -- ALTER COLUMN edition TYPE VARCHAR(50);

-- ALTER TABLE books
-- ALTER COLUMN lan_guage TYPE CHAR(20);


CREATE TABLE authors(
	author_id INT PRIMARY KEY,
	name VARCHAR(150) NOT NULL,
	bio TEXT,
	photo_url VARCHAR(255),
    address VARCHAR(255)
);




CREATE TABLE book_author (
    book_id   INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    PRIMARY KEY (book_id, author_id),
    CONSTRAINT fk_book_author_book
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT fk_book_author_author
        FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE
);



// CART
CREATE TABLE IF NOT EXISTS cart (
    cart_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE
        REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS cart_item (
    cart_item_id BIGINT PRIMARY KEY,
    cart_id BIGINT NOT NULL
        REFERENCES cart(cart_id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL
        REFERENCES books(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1
        CHECK (quantity > 0),

    UNIQUE (cart_id, book_id)
);



CREATE INDEX IF NOT EXISTS idx_cart_item_cart_id
    ON cart_item(cart_id);


CREATE TABLE publications (
    publication_id INT PRIMARY KEY,
    title VARCHAR(150) NOT NULL ,
    bio TEXT,
    cover_image_url VARCHAR(255)
)


CREATE TABLE book_publication_create (
    book_id INT REFERENCES books(id),
    publication_id INT REFERENCES publications(publication_id),
    PRIMARY KEY (book_id, publication_id)
);


CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL
);



CREATE TABLE coupons (
    coupon_id INT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_value DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    usage_limit INTEGER,
    min_order_amount DECIMAL(10, 2),
    max_order_amount DECIMAL(10, 2),
    start_date TIMESTAMP,
    end_date TIMESTAMP
);



CREATE TABLE courier (
    courier_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);




CREATE TABLE users (
    user_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    last_login TIMESTAMP
);



CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    address_id INTEGER REFERENCES addresses(address_id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROPER INDEXING FOR MAKING FASTER
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);


CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    copy_id INTEGER NOT NULL REFERENCES book_copies(copy_id),
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_order_item_order_id ON order_item(order_id);
CREATE INDEX idx_order_item_copy_id ON order_item(copy_id);


CREATE TABLE deliveries (
    delivery_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    tracking_no VARCHAR(100),
    delivered_via VARCHAR(100),
    dispatch_date TIMESTAMP,
    est_date TIMESTAMP,
    delivered_at TIMESTAMP,
    status VARCHAR(50)
);

CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(50) DEFAULT 'Pending'
);



CREATE TABLE mfs_payments (
    payment_id INTEGER PRIMARY KEY REFERENCES payments(payment_id) ON DELETE CASCADE,
    sender_mobile_no VARCHAR(20),
    provider_name VARCHAR(50)
);



CREATE TABLE card_payments (
    payment_id INTEGER PRIMARY KEY REFERENCES payments(payment_id) ON DELETE CASCADE,
    card_last_4_digits CHAR(4),
    bank_name VARCHAR(100),
    card_brand VARCHAR(50)
);



CREATE TABLE cash_on_deliveries (
    payment_id INTEGER PRIMARY KEY REFERENCES payments(payment_id) ON DELETE CASCADE,
    collected_by VARCHAR(100),
    collection_date TIMESTAMP
);





CREATE TABLE returns (
    return_id SERIAL PRIMARY KEY,
    order_item_id INTEGER NOT NULL REFERENCES order_items(order_item_id),
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Requested',
    quantity INTEGER DEFAULT 1,
    approved_at TIMESTAMP
);



CREATE TABLE refunds (
    refund_id SERIAL PRIMARY KEY,
    return_id INTEGER NOT NULL REFERENCES returns(return_id),
    payment_id INTEGER REFERENCES payments(payment_id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending'
);



CREATE TABLE wishlist (
    wishlist_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE wishlist_item (
    wishlist_item_id SERIAL PRIMARY KEY,
    wishlist_id INTEGER NOT NULL REFERENCES wishlist(wishlist_id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    added_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (wishlist_id, book_id)
);


CREATE TABLE admin (
    admin_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    status VARCHAR(50) NOT NULL DEFAULT 'Active'
);
 


 
 CREATE TABLE admin_activity_log (
    log_id SERIAL PRIMARY KEY,
    admin_id INT NOT NULL REFERENCES admin(admin_id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);