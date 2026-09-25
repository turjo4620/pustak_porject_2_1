BEGIN;

-- Restore the serial defaults and move each sequence past existing rows.
CREATE SEQUENCE IF NOT EXISTS publications_publication_id_seq;
ALTER SEQUENCE publications_publication_id_seq OWNED BY publications.publication_id;
ALTER TABLE publications
  ALTER COLUMN publication_id SET DEFAULT nextval('publications_publication_id_seq'::regclass);
SELECT setval(
  'publications_publication_id_seq',
  GREATEST(COALESCE((SELECT MAX(publication_id) FROM publications), 0) + 1, 1),
  false
);

CREATE SEQUENCE IF NOT EXISTS categories_category_id_seq;
ALTER SEQUENCE categories_category_id_seq OWNED BY categories.category_id;
ALTER TABLE categories
  ALTER COLUMN category_id SET DEFAULT nextval('categories_category_id_seq'::regclass);
SELECT setval(
  'categories_category_id_seq',
  GREATEST(COALESCE((SELECT MAX(category_id) FROM categories), 0) + 1, 1),
  false
);

CREATE SEQUENCE IF NOT EXISTS authors_author_id_seq;
ALTER SEQUENCE authors_author_id_seq OWNED BY authors.author_id;
ALTER TABLE authors
  ALTER COLUMN author_id SET DEFAULT nextval('authors_author_id_seq'::regclass);
SELECT setval(
  'authors_author_id_seq',
  GREATEST(COALESCE((SELECT MAX(author_id) FROM authors), 0) + 1, 1),
  false
);

CREATE SEQUENCE IF NOT EXISTS coupons_coupon_id_seq;
ALTER SEQUENCE coupons_coupon_id_seq OWNED BY coupons.coupon_id;
ALTER TABLE coupons
  ALTER COLUMN coupon_id SET DEFAULT nextval('coupons_coupon_id_seq'::regclass);
SELECT setval(
  'coupons_coupon_id_seq',
  GREATEST(COALESCE((SELECT MAX(coupon_id) FROM coupons), 0) + 1, 1),
  false
);

COMMIT;
