-- Split payment columns for advance (other) payments
ALTER TABLE other_payment_orders_master
  ADD COLUMN isSplitPayment TINYINT(1) NOT NULL DEFAULT 0 AFTER paymentMode,
  ADD COLUMN splitCashAmount DECIMAL(10, 2) NULL AFTER isSplitPayment,
  ADD COLUMN splitUpiAmount DECIMAL(10, 2) NULL AFTER splitCashAmount,
  ADD COLUMN splitPaymentSummary VARCHAR(500) NULL AFTER splitUpiAmount;
