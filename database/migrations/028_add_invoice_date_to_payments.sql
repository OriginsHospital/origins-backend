-- =====================================================
-- ADD INVOICE DATE COLUMN TO PAYMENTS TABLE
-- =====================================================
-- This migration adds the invoiceDate column to the payments table
-- =====================================================

ALTER TABLE payments 
ADD COLUMN invoiceDate DATE NULL COMMENT 'Date of invoice' AFTER paymentDate;

-- Add index for invoiceDate for better query performance
CREATE INDEX idx_invoiceDate ON payments(invoiceDate);

