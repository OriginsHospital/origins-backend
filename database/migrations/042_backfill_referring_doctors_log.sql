-- Backfill audit log entries for referring doctors created before log fix
INSERT INTO referring_doctors_log (
    referringDoctorId,
    doctorName,
    action,
    previousValue,
    updatedValue,
    performedBy,
    performedAt
)
SELECT
    rd.id,
    rd.doctorName,
    'Created',
    '-',
    CONCAT(
        'Name: Dr. ', rd.doctorName,
        '; Specialization: ', rd.specialization,
        '; Branch ID: ', rd.branchId,
        '; Area/Village: ', rd.areaVillage,
        '; Contact: ', rd.contactNumber,
        '; Hospital: ', rd.hospitalName,
        '; Status: Active'
    ),
    COALESCE(rd.createdBy, rd.updatedBy, 1),
    rd.createdAt
FROM referring_doctors rd
WHERE NOT EXISTS (
    SELECT 1
    FROM referring_doctors_log rdl
    WHERE rdl.referringDoctorId = rd.id
);
