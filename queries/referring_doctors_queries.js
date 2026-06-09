const getReferringDoctorsQuery = `
SELECT
    rd.id,
    rd.doctorName,
    CONCAT('Dr. ', rd.doctorName) AS doctorDisplayName,
    rd.specialization,
    rd.branchId,
    (SELECT bm.branchCode FROM branch_master bm WHERE bm.id = rd.branchId) AS branch,
    (SELECT bm.name FROM branch_master bm WHERE bm.id = rd.branchId) AS branchName,
    rd.areaVillage,
    rd.contactNumber,
    rd.hospitalName,
    rd.isActive,
    CASE WHEN rd.isActive = 1 THEN 'Active' ELSE 'Inactive' END AS status,
    (SELECT u.fullName FROM users u WHERE u.id = rd.createdBy) AS createdBy,
    DATE_FORMAT(rd.createdAt, '%d-%m-%Y %H:%i') AS createdDate,
    rd.createdAt,
    (SELECT u.fullName FROM users u WHERE u.id = rd.updatedBy) AS updatedBy,
    DATE_FORMAT(rd.updatedAt, '%d-%m-%Y %H:%i') AS updatedDate,
    rd.updatedAt
FROM referring_doctors rd
WHERE 1=1
`;

const insertReferringDoctorQuery = `
INSERT INTO referring_doctors (
    doctorName, specialization, branchId, areaVillage,
    contactNumber, hospitalName, isActive, createdBy, updatedBy
) VALUES (
    :doctorName, :specialization, :branchId, :areaVillage,
    :contactNumber, :hospitalName, :isActive, :userId, :userId
)
`;

const updateReferringDoctorQuery = `
UPDATE referring_doctors SET
    doctorName = :doctorName,
    specialization = :specialization,
    branchId = :branchId,
    areaVillage = :areaVillage,
    contactNumber = :contactNumber,
    hospitalName = :hospitalName,
    isActive = :isActive,
    updatedBy = :userId,
    updatedAt = CURRENT_TIMESTAMP
WHERE id = :id
`;

const getReferringDoctorByIdQuery = `
SELECT * FROM referring_doctors WHERE id = :id LIMIT 1
`;

const getReferringDoctorByContactNumberQuery = `
SELECT id, doctorName, contactNumber
FROM referring_doctors
WHERE contactNumber = :contactNumber
  AND (:excludeId IS NULL OR id != :excludeId)
LIMIT 1
`;

const insertReferringDoctorLogQuery = `
INSERT INTO referring_doctors_log (
    referringDoctorId, doctorName, action, previousValue, updatedValue, performedBy
) VALUES (
    :referringDoctorId, :doctorName, :action, :previousValue, :updatedValue, :performedBy
)
`;

const getReferringDoctorsLogQuery = `
SELECT
    rdl.id,
    rdl.referringDoctorId,
    rdl.doctorName,
    CONCAT('Dr. ', rdl.doctorName) AS doctorDisplayName,
    rdl.action,
    rdl.updatedValue,
    rd.specialization AS rdSpecialization,
    rd.areaVillage AS rdAreaVillage,
    rd.contactNumber AS rdContactNumber,
    rd.hospitalName AS rdHospitalName,
    COALESCE(bm.branchCode, bm.name) AS rdBranch,
    (SELECT u.fullName FROM users u WHERE u.id = rdl.performedBy) AS performedBy,
    DATE_FORMAT(rdl.performedAt, '%d-%m-%Y %H:%i') AS performedAt,
    rdl.performedAt AS performedAtRaw
FROM referring_doctors_log rdl
LEFT JOIN referring_doctors rd ON rd.id = rdl.referringDoctorId
LEFT JOIN branch_master bm ON bm.id = rd.branchId
ORDER BY rdl.performedAt DESC, rdl.id DESC
`;

module.exports = {
  getReferringDoctorsQuery,
  insertReferringDoctorQuery,
  updateReferringDoctorQuery,
  getReferringDoctorByIdQuery,
  getReferringDoctorByContactNumberQuery,
  insertReferringDoctorLogQuery,
  getReferringDoctorsLogQuery
};
