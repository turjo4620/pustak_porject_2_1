-- Addresses for the 30 dummy users from seed_dummy_data_v3.sql (one default address each)

BEGIN;

INSERT INTO addresses (user_id, street, area, district, division, postal_code, is_default)
VALUES
  (1786230010, 'Lane 2', 'Sadar', 'Mymensingh', 'Mymensingh', '2200', TRUE),
  (1786230142, 'Lane 2', 'Khalishpur', 'Khulna', 'Khulna', '9000', TRUE),
  (1786230298, 'Road 9A', 'Comilla Sadar', 'Cumilla', 'Chattogram', '3500', TRUE),
  (1786230425, 'Sector 7', 'Mohammadpur', 'Dhaka', 'Dhaka', '1207', TRUE),
  (1786230575, 'Road 9A', 'Sadar', 'Barisal', 'Barisal', '8200', TRUE),
  (1786230721, 'Plot 18', 'Mohammadpur', 'Dhaka', 'Dhaka', '1207', TRUE),
  (1786230830, 'House 12, Lane 3', 'Khalishpur', 'Khulna', 'Khulna', '9000', TRUE),
  (1786230997, 'Road 27', 'Banani', 'Dhaka', 'Dhaka', '1213', TRUE),
  (1786231122, 'House 12, Lane 3', 'Sadar', 'Mymensingh', 'Mymensingh', '2200', TRUE),
  (1786231269, 'Road No. 5', 'Cox s Bazar Sadar', 'Cox s Bazar', 'Chattogram', '4700', TRUE),
  (1786231380, 'Apartment 3B', 'Khalishpur', 'Khulna', 'Khulna', '9000', TRUE),
  (1786231527, 'Plot 18', 'Mohammadpur', 'Dhaka', 'Dhaka', '1207', TRUE),
  (1786231651, 'Plot 18', 'Dhanmondi', 'Dhaka', 'Dhaka', '1209', TRUE),
  (1786231794, 'Road 9A', 'Uttara', 'Dhaka', 'Dhaka', '1230', TRUE),
  (1786231964, 'Road No. 5', 'Mirpur', 'Dhaka', 'Dhaka', '1216', TRUE),
  (1786232095, 'Sector 7', 'Agrabad', 'Chattogram', 'Chattogram', '4100', TRUE),
  (1786232220, 'Plot 18', 'Dhanmondi', 'Dhaka', 'Dhaka', '1209', TRUE),
  (1786232367, 'Lane 2', 'Amberkhana', 'Sylhet', 'Sylhet', '3100', TRUE),
  (1786232482, 'Lane 2', 'Comilla Sadar', 'Cumilla', 'Chattogram', '3500', TRUE),
  (1786232609, 'Sector 7', 'Sadar', 'Rangpur', 'Rangpur', '5400', TRUE),
  (1786232772, 'Sector 7', 'Zindabazar', 'Sylhet', 'Sylhet', '3100', TRUE),
  (1786232896, 'Lane 2', 'Dhanmondi', 'Dhaka', 'Dhaka', '1209', TRUE),
  (1786233047, 'House 12, Lane 3', 'Khalishpur', 'Khulna', 'Khulna', '9000', TRUE),
  (1786233161, 'Road 27', 'Sadar', 'Khulna', 'Khulna', '9100', TRUE),
  (1786233331, 'Road 9A', 'Uttara', 'Dhaka', 'Dhaka', '1230', TRUE),
  (1786233462, 'Road 27', 'Amberkhana', 'Sylhet', 'Sylhet', '3100', TRUE),
  (1786233607, 'Sector 7', 'Sadar', 'Rangpur', 'Rangpur', '5400', TRUE),
  (1786233737, 'Road 27', 'Dhanmondi', 'Dhaka', 'Dhaka', '1209', TRUE),
  (1786233842, 'House 12, Lane 3', 'Comilla Sadar', 'Cumilla', 'Chattogram', '3500', TRUE),
  (1786233978, 'House 12, Lane 3', 'Shaheb Bazar', 'Rajshahi', 'Rajshahi', '6000', TRUE);

COMMIT;