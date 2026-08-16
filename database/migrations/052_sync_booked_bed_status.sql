-- Keep bed colour status in sync with actual bookings.
-- Booked beds that were only flagged with isBooked stayed "Available" on Book Option.

UPDATE room_bed_association
SET status = 'Occupied'
WHERE isBooked = 1
  AND (status IS NULL OR status = 'Available');
