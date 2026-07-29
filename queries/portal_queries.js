const searchPatientsForPortalQuery = `
SELECT 
  pm.id AS patientMasterId,
  pm.patientId AS patientCode,
  CONCAT(COALESCE(pm.firstName, ''), ' ', COALESCE(pm.lastName, '')) AS fullName,
  pm.firstName,
  pm.lastName,
  pm.mobileNo,
  pm.email,
  pm.gender,
  pm.dateOfBirth,
  pm.aadhaarNo,
  bm.name AS branchName,
  bm.id AS branchId,
  CASE WHEN pa.id IS NOT NULL THEN 1 ELSE 0 END AS hasPortalLogin,
  pa.email AS portalEmail,
  pa.isActive AS portalActive
FROM patient_master pm
LEFT JOIN branch_master bm ON bm.id = pm.branchId
LEFT JOIN portal_accounts pa ON pa.patientMasterId = pm.id AND pa.accountType = 'patient'
WHERE (
  :q = ''
  OR pm.patientId LIKE CONCAT('%', :q, '%')
  OR pm.mobileNo LIKE CONCAT('%', :q, '%')
  OR pm.aadhaarNo LIKE CONCAT('%', :q, '%')
  OR pm.email LIKE CONCAT('%', :q, '%')
  OR CONCAT(COALESCE(pm.firstName, ''), ' ', COALESCE(pm.lastName, '')) LIKE CONCAT('%', :q, '%')
  OR CONCAT(COALESCE(pm.lastName, ''), ' ', COALESCE(pm.firstName, '')) LIKE CONCAT('%', :q, '%')
)
ORDER BY pm.id DESC
LIMIT 50
`;

const getPatientProfileQuery = `
SELECT 
  pm.id AS patientMasterId,
  pm.patientId AS patientCode,
  CONCAT(COALESCE(pm.firstName, ''), ' ', COALESCE(pm.lastName, '')) AS fullName,
  pm.firstName,
  pm.lastName,
  pm.mobileNo,
  pm.email,
  pm.gender,
  pm.dateOfBirth,
  pm.bloodGroup,
  pm.maritalStatus,
  pm.photoPath,
  bm.name AS branchName
FROM patient_master pm
LEFT JOIN branch_master bm ON bm.id = pm.branchId
WHERE pm.id = :patientMasterId
LIMIT 1
`;

const getPatientVisitsQuery = `
SELECT 
  pva.id AS visitId,
  DATE_FORMAT(pva.visitDate, '%Y-%m-%d') AS visitDate,
  pva.isActive,
  (SELECT vtm.name FROM visit_type_master vtm WHERE vtm.id = pva.type) AS visitType,
  (SELECT pkg.name FROM package_master pkg WHERE pkg.id = pva.packageChosen) AS packageName
FROM patient_visits_association pva
WHERE pva.patientId = :patientMasterId
ORDER BY pva.visitDate DESC, pva.id DESC
`;

const getPatientTreatmentsQuery = `
SELECT * FROM (
  SELECT
    taa.id AS appointmentId,
    DATE_FORMAT(taa.appointmentDate, '%Y-%m-%d') AS appointmentDate,
    'Treatment' AS type,
    pva.id AS visitId,
    pva.isActive AS visitActive,
    (SELECT pkg.name FROM package_master pkg WHERE pkg.id = pva.packageChosen) AS packageName,
    (SELECT u.fullName FROM users u WHERE u.id = taa.consultationDoctorId) AS doctorName,
    CASE WHEN taa.isDone = 1 THEN 'Completed' WHEN taa.isSeen = 1 THEN 'In progress' ELSE 'Scheduled' END AS appointmentStatus,
    (SELECT vtm.name FROM visit_type_master vtm WHERE vtm.id = pva.type) AS visitType
  FROM treatment_appointments_associations taa
  INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId
  INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
  WHERE pva.patientId = :patientMasterId

  UNION ALL

  SELECT
    caa.id AS appointmentId,
    DATE_FORMAT(caa.appointmentDate, '%Y-%m-%d') AS appointmentDate,
    'Consultation' AS type,
    pva.id AS visitId,
    pva.isActive AS visitActive,
    (SELECT pkg.name FROM package_master pkg WHERE pkg.id = pva.packageChosen) AS packageName,
    (SELECT u.fullName FROM users u WHERE u.id = caa.consultationDoctorId) AS doctorName,
    CASE WHEN caa.isDone = 1 THEN 'Completed' WHEN caa.isSeen = 1 THEN 'In progress' ELSE 'Scheduled' END AS appointmentStatus,
    (SELECT vtm.name FROM visit_type_master vtm WHERE vtm.id = pva.type) AS visitType
  FROM consultation_appointments_associations caa
  INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
  INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
  WHERE pva.patientId = :patientMasterId
) appointments
ORDER BY appointmentDate DESC, appointmentId DESC
LIMIT 100
`;

const getPatientMedicinesQuery = `
SELECT * FROM (
  SELECT 
    pva.id AS visitId,
    DATE_FORMAT(pva.visitDate, '%Y-%m-%d') AS visitDate,
    caa.id AS appointmentId,
    DATE_FORMAT(caa.appointmentDate, '%Y-%m-%d') AS appointmentDate,
    'Consultation' AS appointmentType,
    (SELECT u.fullName FROM users u WHERE u.id = caa.consultationDoctorId) AS doctorName,
    pm.itemName AS medicineName,
    calba.prescriptionDetails AS prescriptionDetails,
    calba.prescriptionDays AS prescriptionDays,
    calba.prescribedQuantity AS prescribedQuantity,
    COALESCE(calba.purchaseQuantity, 0) AS purchasedQuantity,
    calba.status AS paymentStatus
  FROM consultation_appointment_line_bills_associations calba
  INNER JOIN consultation_appointments_associations caa ON caa.id = calba.appointmentId
  INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
  INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
  LEFT JOIN stockmanagement.item_master pm ON pm.id = calba.billTypeValue AND calba.billTypeId = 3
  WHERE pva.patientId = :patientMasterId
    AND calba.billTypeId = 3
    AND calba.isSpouse = 0

  UNION ALL

  SELECT 
    pva.id AS visitId,
    DATE_FORMAT(pva.visitDate, '%Y-%m-%d') AS visitDate,
    taa.id AS appointmentId,
    DATE_FORMAT(taa.appointmentDate, '%Y-%m-%d') AS appointmentDate,
    'Treatment' AS appointmentType,
    (SELECT u.fullName FROM users u WHERE u.id = taa.consultationDoctorId) AS doctorName,
    pm.itemName AS medicineName,
    talba.prescriptionDetails AS prescriptionDetails,
    talba.prescriptionDays AS prescriptionDays,
    talba.prescribedQuantity AS prescribedQuantity,
    COALESCE(talba.purchaseQuantity, 0) AS purchasedQuantity,
    talba.status AS paymentStatus
  FROM treatment_appointment_line_bills_associations talba
  INNER JOIN treatment_appointments_associations taa ON taa.id = talba.appointmentId
  INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId
  INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
  LEFT JOIN stockmanagement.item_master pm ON pm.id = talba.billTypeValue AND talba.billTypeId = 3
  WHERE pva.patientId = :patientMasterId
    AND talba.billTypeId = 3
    AND talba.isSpouse = 0
) AS pharmacy_history
ORDER BY appointmentDate DESC, medicineName ASC
`;

const getPatientLabReportsQuery = `
SELECT * FROM (
  SELECT
    calba.appointmentId AS appointmentId,
    DATE_FORMAT(caa.appointmentDate, '%Y-%m-%d') AS reportDate,
    'Consultation' AS type,
    ltm.name AS labTestName,
    CASE 
      WHEN (SELECT COUNT(*) FROM lab_test_results ltr 
            WHERE ltr.appointmentId = calba.appointmentId
              AND ltr.labTestId = ltm.id 
              AND ltr.type = 'CONSULTATION' 
              AND ltr.isSpouse = calba.isSpouse 
              AND ltr.labTestStatus = 2) > 0 THEN 'Completed'
      WHEN (SELECT COUNT(*) FROM lab_test_results ltr 
            WHERE ltr.appointmentId = calba.appointmentId
              AND ltr.labTestId = ltm.id 
              AND ltr.type = 'CONSULTATION' 
              AND ltr.isSpouse = calba.isSpouse 
              AND ltr.labTestStatus = 1) > 0 THEN 'In Progress'
      ELSE 'Pending'
    END AS reportStatus,
    (SELECT u.fullName FROM users u WHERE u.id = caa.consultationDoctorId) AS doctorName
  FROM consultation_appointment_line_bills_associations calba
  INNER JOIN consultation_appointments_associations caa ON caa.id = calba.appointmentId
  INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
  INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
  INNER JOIN lab_test_master ltm ON ltm.id = calba.billTypeValue
  WHERE pva.patientId = :patientMasterId
    AND calba.status = 'PAID'
    AND calba.billTypeId = 1
    AND calba.isSpouse = 0

  UNION ALL

  SELECT
    talba.appointmentId AS appointmentId,
    DATE_FORMAT(taa.appointmentDate, '%Y-%m-%d') AS reportDate,
    'Treatment' AS type,
    ltm.name AS labTestName,
    CASE 
      WHEN (SELECT COUNT(*) FROM lab_test_results ltr 
            WHERE ltr.appointmentId = talba.appointmentId
              AND ltr.labTestId = ltm.id 
              AND ltr.type = 'TREATMENT' 
              AND ltr.isSpouse = talba.isSpouse 
              AND ltr.labTestStatus = 2) > 0 THEN 'Completed'
      WHEN (SELECT COUNT(*) FROM lab_test_results ltr 
            WHERE ltr.appointmentId = talba.appointmentId
              AND ltr.labTestId = ltm.id 
              AND ltr.type = 'TREATMENT' 
              AND ltr.isSpouse = talba.isSpouse 
              AND ltr.labTestStatus = 1) > 0 THEN 'In Progress'
      ELSE 'Pending'
    END AS reportStatus,
    (SELECT u.fullName FROM users u WHERE u.id = taa.consultationDoctorId) AS doctorName
  FROM treatment_appointment_line_bills_associations talba
  INNER JOIN treatment_appointments_associations taa ON taa.id = talba.appointmentId
  INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId
  INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
  INNER JOIN lab_test_master ltm ON ltm.id = talba.billTypeValue
  WHERE pva.patientId = :patientMasterId
    AND talba.status = 'PAID'
    AND talba.billTypeId = 1
    AND talba.isSpouse = 0
) reports
ORDER BY reportDate DESC, labTestName ASC
LIMIT 200
`;

const getStaffListQuery = `
SELECT 
  u.id,
  u.fullName,
  u.email,
  u.userName,
  u.isAdminVerified,
  u.isBlocked,
  JSON_OBJECT('id', rm.id, 'name', rm.name) AS roleDetails,
  (
    SELECT JSON_ARRAYAGG(JSON_OBJECT('id', bm.id, 'name', bm.name))
    FROM user_branch_association uba
    INNER JOIN branch_master bm ON bm.id = uba.branchId
    WHERE uba.userId = u.id
  ) AS branchDetails,
  u.createdAt
FROM users u
INNER JOIN role_master rm ON rm.id = u.roleId
ORDER BY u.id DESC
LIMIT 200
`;

const getPatientLoginsQuery = `
SELECT 
  pa.id,
  pa.email,
  pa.fullName,
  pa.mobileNo,
  pa.patientCode,
  pa.patientMasterId,
  pa.isActive,
  pa.createdAt,
  CONCAT(COALESCE(pm.firstName, ''), ' ', COALESCE(pm.lastName, '')) AS patientName,
  pm.aadhaarNo
FROM portal_accounts pa
LEFT JOIN patient_master pm ON pm.id = pa.patientMasterId
WHERE pa.accountType = 'patient'
ORDER BY pa.id DESC
`;

module.exports = {
  searchPatientsForPortalQuery,
  getPatientProfileQuery,
  getPatientVisitsQuery,
  getPatientTreatmentsQuery,
  getPatientMedicinesQuery,
  getPatientLabReportsQuery,
  getStaffListQuery,
  getPatientLoginsQuery
};
