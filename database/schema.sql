CREATE DATABASE IF NOT EXISTS messconnect;
USE messconnect;

CREATE TABLE `admin` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL
);

CREATE TABLE `customer` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `address` TEXT,
  `profile_image` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `vendor` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `owner_name` VARCHAR(100) NOT NULL,
  `mess_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `address` TEXT,
  `description` TEXT,
  `image` VARCHAR(255),
  `status` VARCHAR(20) DEFAULT 'PENDING',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `plan` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `vendor_id` BIGINT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `duration` INT NOT NULL COMMENT 'Duration in days',
  `meals_per_day` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`vendor_id`) REFERENCES `vendor`(`id`) ON DELETE CASCADE
);

CREATE TABLE `menu` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `vendor_id` BIGINT NOT NULL,
  `day` VARCHAR(15) NOT NULL,
  `breakfast` TEXT,
  `lunch` TEXT,
  `dinner` TEXT,
  FOREIGN KEY (`vendor_id`) REFERENCES `vendor`(`id`) ON DELETE CASCADE
);

CREATE TABLE `subscription` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` BIGINT NOT NULL,
  `plan_id` BIGINT NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` VARCHAR(20) DEFAULT 'ACTIVE',
  FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`plan_id`) REFERENCES `plan`(`id`) ON DELETE CASCADE
);

CREATE TABLE `payment` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `subscription_id` BIGINT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(50),
  `transaction_id` VARCHAR(100),
  `status` VARCHAR(20) DEFAULT 'PENDING',
  `payment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`subscription_id`) REFERENCES `subscription`(`id`) ON DELETE CASCADE
);

CREATE TABLE `review` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` BIGINT NOT NULL,
  `vendor_id` BIGINT NOT NULL,
  `rating` INT CHECK (`rating` BETWEEN 1 AND 5),
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`vendor_id`) REFERENCES `vendor`(`id`) ON DELETE CASCADE
);

CREATE TABLE `notification` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `user_type` VARCHAR(20) NOT NULL COMMENT 'ADMIN, CUSTOMER, VENDOR',
  `message` TEXT NOT NULL,
  `type` VARCHAR(50),
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
