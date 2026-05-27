CREATE DATABASE shopping_cart_db;
USE shopping_cart_db;

CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  PRIMARY KEY (id),
  UNIQUE KEY username (username)
);

CREATE TABLE products (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(50),
  image VARCHAR(255),
  PRIMARY KEY (id)
);

CREATE TABLE cart_items (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY unique_user_product (user_id, product_id),
  KEY fk_cart_product (product_id),
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO products (name, price, category, image) VALUES
('Milk', 3.20, 'Dairy', 'IMG_4645.PNG'),
('Eggs (12 pack)', 6.50, 'Dairy', 'IMG_4646.PNG'),
('Cheese', 7.70, 'Dairy', 'IMG_4647.PNG'),
('Butter', 5.50, 'Dairy', 'IMG_4648.PNG'),
('Apples', 1.26, 'Produce', 'IMG_4649.PNG'),
('Bananas', 0.70, 'Produce', 'IMG_4650.PNG'),
('Potato', 0.88, 'Produce', 'IMG_4651.PNG'),
('Tomato', 0.98, 'Produce', 'IMG_4652.PNG'),
('Carrot', 0.35, 'Produce', 'IMG_4653.PNG'),
('Bread', 2.50, 'Bakery', 'IMG_4654.PNG'),
('Buns (Pack)', 3.60, 'Bakery', 'IMG_4655.PNG'),
('Cake', 7.00, 'Bakery', 'IMG_4656.PNG'),
('Chicken Breast', 4.20, 'Meat', 'IMG_4658.PNG'),
('Beef', 12.00, 'Meat', 'IMG_4659.PNG'),
('Pork', 12.00, 'Meat', 'IMG_4660.PNG'),
('Chocolate', 3.20, 'Snacks', 'IMG_4661.PNG'),
('Beef Jerky', 6.80, 'Snacks', 'IMG_4662.PNG'),
('Cookies', 3.10, 'Snacks', 'IMG_4663.PNG'),
('Coca Cola', 2.50, 'Drinks', 'IMG_4664.PNG'),
('Orange Juice', 3.20, 'Drinks', 'IMG_4665.PNG'),
('Water Bottle', 1.20, 'Drinks', 'IMG_4666.PNG'),
('Pasta', 2.50, 'Pantry', 'IMG_4667.PNG'),
('Canned Beans', 2.20, 'Pantry', 'IMG_4668.PNG');