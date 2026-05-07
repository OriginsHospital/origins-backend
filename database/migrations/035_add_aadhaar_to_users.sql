ALTER TABLE users
ADD COLUMN aadhaarNo VARCHAR(12) NULL AFTER email;

ALTER TABLE users
ADD UNIQUE KEY uq_users_aadhaarNo (aadhaarNo);
