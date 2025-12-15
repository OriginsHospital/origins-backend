const getPatientInfoForConsentForm = `
SELECT 
    pm.patientId,
    CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) AS patientName,
    pm.dateOfBirth,
    CONCAT(YEAR(NOW()) - YEAR(pm.dateOfBirth)) AS patientAge,
    CONCAT(YEAR(NOW()) - YEAR(pm.dateOfBirth), ' / ', pm.gender) AS patientAgeGender,
    pm.gender AS patientGender,
    COALESCE(pga.name, '') AS guardianName,
    bm.address as hospitalAddress,
    CAST(NOW() as DATE) as currentDate,
    CONCAT(
    	COALESCE(pm.addressLine1),', ',
    	COALESCE(pm.addressLine2),', ',
    	COALESCE((select cm.name from city_master cm where cm.id = pm.cityId),''),', ',
    	COALESCE((select sm.name from state_master sm where sm.id = pm.stateId),'')
    ) as patientAddress,
    'Origins Hospital' as hospitalName, 
    'K.Jhansi Rani' as doctorName,
    'Origins Hospital' as artClinicName,
    bm.address as artClinicAddress,
    bm.name as place,
	bm.phoneNumber,
	bm.logoText
FROM 
    patient_master pm
LEFT JOIN 
    patient_guardian_associations pga ON pga.patientId = pm.id
INNER JOIN 
	branch_master bm ON bm.id = pm.branchId 
WHERE pm.patientId = :patientId
`;

module.exports = {
  getPatientInfoForConsentForm
};
