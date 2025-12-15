const hospitalLogoInformationQuery = `
select JSON_OBJECT(
	'branchName', bm.name ,
	'branchAddress', bm.address,
	'branchPhoneNumber', bm.phoneNumber,
	'logoText', bm.logoText
) as logoInformation from consultation_appointments_associations caa 
INNER JOIN visit_consultations_associations vca on vca.id = caa.consultationId 
INNER JOIN patient_visits_association pva on pva.id = vca.visitId 
INNER JOIN patient_master pm on pm.Id = pva.patientId
INNER JOIN branch_master bm on bm.id = caa.branchId
WHERE caa.id = :appointmentId and :type = 'Consultation'
UNION ALL
select JSON_OBJECT(
	'branchName', bm.name ,
	'branchAddress', bm.address,
	'branchPhoneNumber', bm.phoneNumber,
	'logoText', bm.logoText
) as logoInformation from treatment_appointments_associations taa 
INNER JOIN visit_treatment_cycles_associations vtca on vtca.id = taa.treatmentCycleId 
INNER JOIN patient_visits_association pva on pva.id = vtca.visitId 
INNER JOIN patient_master pm on pm.Id = pva.patientId
INNER JOIN branch_master bm on bm.id = taa.branchId
WHERE taa.id = :appointmentId and :type = 'Treatment'
`;

const hospitalLogoInformationQueryForTreatmentOrder = `
select JSON_OBJECT(
	'branchName', bm.name ,
	'branchAddress', bm.address,
	'branchPhoneNumber', bm.phoneNumber,
	'logoText', bm.logoText
) as logoInformation from treatment_orders_master tom 
INNER JOIN patient_visits_association pva on pva.id = tom.visitId 
INNER JOIN patient_master pm on pm.Id = pva.patientId
INNER JOIN branch_master bm on bm.id = pm.branchId
WHERE :type = 'Treatment' and tom.id = :id;
`;

const hospitalLogoInformationUsingPatientIdQuery = `
select JSON_OBJECT(
	'branchName', bm.name ,
	'branchAddress', bm.address,
	'branchPhoneNumber', bm.phoneNumber,
	'logoText', bm.logoText
) as logoInformation from patient_master pm
INNER JOIN branch_master bm on bm.id = pm.branchId
WHERE pm.id = :patientId;
`;

module.exports = {
  hospitalLogoInformationQuery,
  hospitalLogoInformationQueryForTreatmentOrder,
  hospitalLogoInformationUsingPatientIdQuery
};
