-- Add consultation fee configuration for Vikarabad (VKB) branch,
-- matching Hyderabad (HYD) amounts and validity periods.
INSERT INTO consultation_fee_branch_association
  (amount, branchId, patientTypeId, validity, createdAt, updatedAt)
SELECT
  hyd.amount,
  vkb.id,
  hyd.patientTypeId,
  hyd.validity,
  NOW(),
  NOW()
FROM consultation_fee_branch_association hyd
INNER JOIN branch_master hyd_branch
  ON hyd_branch.id = hyd.branchId
  AND hyd_branch.branchCode = 'HYD'
CROSS JOIN branch_master vkb
WHERE vkb.branchCode = 'VKB'
  AND vkb.isActive = 1
  AND NOT EXISTS (
    SELECT 1
    FROM consultation_fee_branch_association existing
    WHERE existing.branchId = vkb.id
      AND existing.patientTypeId = hyd.patientTypeId
  );
