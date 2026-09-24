-- Sequence: addresses_address_id_seq
CREATE SEQUENCE IF NOT EXISTS addresses_address_id_seq
    AS integer
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1
    OWNED BY addresses.address_id;



    -- Sequence: authors_author_id_seq
CREATE SEQUENCE IF NOT EXISTS authors_author_id_seq
    AS integer
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1
    OWNED BY authors.author_id;


    -- Sequence: book_copy_copy_id_seq
CREATE SEQUENCE IF NOT EXISTS book_copy_copy_id_seq
    AS bigint
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1
    OWNED BY book_copy.copy_id;



    -- Sequence: books_id_seq
CREATE SEQUENCE IF NOT EXISTS books_id_seq
    AS integer
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;




    -- Sequence: cart_cart_id_seq
CREATE SEQUENCE IF NOT EXISTS cart_cart_id_seq
    AS bigint
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1
    OWNED BY cart.cart_id;


    -- Sequence: cart_item_cart_item_id_seq
CREATE SEQUENCE IF NOT EXISTS cart_item_cart_item_id_seq
    AS bigint
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1
    OWNED BY cart_item.cart_item_id;


    -- Sequence: categories_category_id_seq
CREATE SEQUENCE IF NOT EXISTS categories_category_id_seq
    AS bigint
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;


    -- Sequence: coupons_coupon_id_seq
CREATE SEQUENCE IF NOT EXISTS coupons_coupon_id_seq
    AS integer
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1
    OWNED BY coupons.coupon_id;


    -- Sequence: courier_courier_id_seq
CREATE SEQUENCE IF NOT EXISTS courier_courier_id_seq
    AS integer
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1
    OWNED BY courier.courier_id;


    -- Sequence: deliveries_delivery_id_seq
CREATE SEQUENCE IF NOT EXISTS deliveries_delivery_id_seq
    AS integer
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1
    OWNED BY deliveries.delivery_id;



    -- Sequence: order_item_order_item_id_seq
CREATE SEQUENCE IF NOT EXISTS order_item_order_item_id_seq
    AS bigint
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1
    OWNED BY order_item.order_item_id;


    -- Sequence: orders_order_id_seq
CREATE SEQUENCE IF NOT EXISTS orders_order_id_seq
    AS integer
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1
    OWNED BY orders.order_id;


    -- Sequence: payments_payment_id_seq
CREATE SEQUENCE IF NOT EXISTS payments_payment_id_seq
    AS integer
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1
    OWNED BY payments.payment_id;


    -- Sequence: publications_publication_id_seq
CREATE SEQUENCE IF NOT EXISTS publications_publication_id_seq
    AS integer
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1
    OWNED BY publications.publication_id;



    -- Sequence: refund_refund_id_seq
CREATE SEQUENCE IF NOT EXISTS refund_refund_id_seq
    AS bigint
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1
    OWNED BY refund.refund_id;


    -- Sequence: return_return_id_seq
CREATE SEQUENCE IF NOT EXISTS return_return_id_seq
    AS bigint
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1
    OWNED BY return.return_id;


    -- Sequence: reviews_review_id_seq
CREATE SEQUENCE IF NOT EXISTS reviews_review_id_seq
    AS integer
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1
    OWNED BY reviews.review_id;



    -- Sequence: wishlist_item_wishlist_item_id_seq
CREATE SEQUENCE IF NOT EXISTS wishlist_item_wishlist_item_id_seq
    AS integer
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1
    OWNED BY wishlist_item.wishlist_item_id;


   -- Sequence: wishlist_wishlist_id_seq
CREATE SEQUENCE IF NOT EXISTS wishlist_wishlist_id_seq
    AS integer
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1
    OWNED BY wishlist.wishlist_id;