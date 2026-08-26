-- Fertility consultation fee is valid for 3 months (90 days).
UPDATE consultation_fee_branch_association cfba
INNER JOIN visit_type_master vtm ON vtm.id = cfba.patientTypeId
SET
  cfba.validity = 90,
  cfba.updatedAt = NOW()
WHERE
  vtm.id = 1
  OR LOWER(vtm.name) LIKE 'fertility%';
