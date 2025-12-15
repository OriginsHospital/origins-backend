const getDoctorsListQuery = `
SELECT DISTINCT u.id as doctorId, u.fullName, 
TIME_FORMAT(cdm.shiftFrom, '%H:%i') as shiftFrom, 
TIME_FORMAT(cdm.shiftTo , '%H:%i') as shiftTo
FROM users u
INNER JOIN user_branch_association uba ON uba.userId = u.id
LEFT JOIN consultation_doctor_master cdm ON cdm.userId  = u.id 
WHERE u.roleId = 2 
  AND u.isAdminVerified = 1 
  AND uba.branchId IN (:branchId);
`;

const checkOverlappingSlotsQuery = `
select
	u.fullName
from
	treatment_appointments_associations vta
INNER JOIN users u
on
	u.id = vta.consultationDoctorId
WHERE
	vta.appointmentDate = :blockedDate
	and ((vta.timeStart <= :timeStart
		AND vta.timeEnd > :timeStart)
	OR (vta.timeStart < :timeEnd
		AND vta.timeEnd >= :timeEnd))
	AND vta.consultationDoctorId = :doctorId
UNION 
select
	u.fullName
from
	consultation_appointments_associations vta
INNER JOIN users u
on
	u.id = vta.consultationDoctorId
WHERE
	vta.appointmentDate = :blockedDate
	and ((vta.timeStart <= :timeStart
		AND vta.timeEnd > :timeStart)
	OR (vta.timeStart < :timeEnd
		AND vta.timeEnd >= :timeEnd))
	AND vta.consultationDoctorId = :doctorId;
`;

const getBlockedTimeSlotsQuery = `
select
	bsm.id,
	bsm.doctorId,
	bsm.blockedDate,
	TIME_FORMAT(bsm.timeStart, '%H:%i') as timeStart,
	TIME_FORMAT(bsm.timeEnd , '%H:%i') as timeEnd,
	bsm.blockType,
	u.fullName as doctorName
from
	blocked_slots_master bsm
INNER JOIN users u on
	bsm.doctorId = u.id
where bsm.blockedDate  = :blockedDate
`;

const getDoctorShiftDetailsQuery = `
select
	cdm.*,
	u.fullName
from
	consultation_doctor_master cdm
INNER JOIN users u on
	u.id = cdm.userId
WHERE u.id = :doctorId;
`;

module.exports = {
  getDoctorsListQuery,
  checkOverlappingSlotsQuery,
  getBlockedTimeSlotsQuery,
  getDoctorShiftDetailsQuery
};
