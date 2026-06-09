-- =====================================================
-- ADD UNIQUE CONSTRAINT ON REFERRING DOCTOR CONTACT NUMBER
-- =====================================================
-- Ensures each 10-digit mobile number can only be registered once
-- =====================================================

ALTER TABLE referring_doctors
ADD UNIQUE KEY idx_contact_number_unique (contactNumber);
