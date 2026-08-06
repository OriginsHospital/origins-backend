const getUptResultsQuery = `
SELECT
    ur.id,
    ur.resultDate,
    DATE_FORMAT(ur.resultDate, '%Y-%m-%d') AS resultDateFormatted,
    ur.branchId,
    bm.branchCode,
    bm.name AS branchName,
    ur.patientId AS patientMasterId,
    pm.patientId AS originsId,
    CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) AS patientName,
    pm.mobileNo,
    ur.cycleType,
    ur.uptResult,
    ur.createdByNurseId,
    opm.personName AS createdByNurseName,
    ur.createdBy,
    DATE_FORMAT(ur.createdAt, '%Y-%m-%d %H:%i:%s') AS createdAt,
    DATE_FORMAT(ur.updatedAt, '%Y-%m-%d %H:%i:%s') AS updatedAt
FROM upt_results ur
INNER JOIN patient_master pm ON pm.id = ur.patientId
LEFT JOIN branch_master bm ON bm.id = ur.branchId
LEFT JOIN ot_person_master opm ON opm.id = ur.createdByNurseId
WHERE 1=1
`;

const insertUptResultQuery = `
INSERT INTO upt_results (
    resultDate,
    branchId,
    patientId,
    cycleType,
    uptResult,
    createdByNurseId,
    createdBy
) VALUES (
    :resultDate,
    :branchId,
    :patientId,
    :cycleType,
    :uptResult,
    :createdByNurseId,
    :createdBy
)
`;

const updateUptResultQuery = `
UPDATE upt_results
SET
    resultDate = :resultDate,
    branchId = :branchId,
    patientId = :patientId,
    cycleType = :cycleType,
    uptResult = :uptResult,
    createdByNurseId = :createdByNurseId,
    updatedAt = CURRENT_TIMESTAMP
WHERE id = :id
`;

const getUptResultByIdQuery = `
SELECT
    ur.id,
    ur.resultDate,
    DATE_FORMAT(ur.resultDate, '%Y-%m-%d') AS resultDateFormatted,
    ur.branchId,
    bm.branchCode,
    bm.name AS branchName,
    ur.patientId AS patientMasterId,
    pm.patientId AS originsId,
    CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) AS patientName,
    ur.cycleType,
    ur.uptResult,
    ur.createdByNurseId,
    opm.personName AS createdByNurseName,
    ur.createdBy,
    DATE_FORMAT(ur.createdAt, '%Y-%m-%d %H:%i:%s') AS createdAt
FROM upt_results ur
INNER JOIN patient_master pm ON pm.id = ur.patientId
LEFT JOIN branch_master bm ON bm.id = ur.branchId
LEFT JOIN ot_person_master opm ON opm.id = ur.createdByNurseId
WHERE ur.id = :id
LIMIT 1
`;

module.exports = {
  getUptResultsQuery,
  insertUptResultQuery,
  updateUptResultQuery,
  getUptResultByIdQuery
};
