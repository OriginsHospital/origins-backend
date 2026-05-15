const isActiveQuery = `SELECT COUNT(*) as activeCount FROM patient_visits_association WHERE patientId = :patientId AND isActive = 1`;

// Any missing required donor document => treat as incomplete (Create Donor, no trigger)
const donorHasIncompleteDocumentsCondition = `
  EXISTS (
    SELECT 1
    FROM visit_donars_associations vda
    WHERE vda.visitId = pva.id
    AND (
      vda.kyc IS NULL OR vda.kyc = ''
      OR vda.marriageCertificate IS NULL OR vda.marriageCertificate = ''
      OR vda.birthCertificate IS NULL OR vda.birthCertificate = ''
      OR vda.aadhaar IS NULL OR vda.aadhaar = ''
      OR vda.donarPhotoUrl IS NULL OR vda.donarPhotoUrl = ''
      OR vda.donarSignatureUrl IS NULL OR vda.donarSignatureUrl = ''
      OR vda.form24b IS NULL OR vda.form24b = ''
      OR vda.insuranceCertificate IS NULL OR vda.insuranceCertificate = ''
      OR vda.spouseAadharCard IS NULL OR vda.spouseAadharCard = ''
      OR vda.artBankCertificate IS NULL OR vda.artBankCertificate = ''
      OR vda.anaesthesiaConsent IS NULL OR vda.anaesthesiaConsent = ''
      OR vda.form13 IS NULL OR vda.form13 = ''
    )
  )
`;

const getDonarInformationQuery = `
SELECT 
    pm.id AS patientId,
    CONCAT(pm.lastName, ' ', pm.firstName) AS patientName,
    COALESCE(pm.firstName,'') as firstName,
    pva.id AS visitId, 
    vtc.treatmentTypeId,
    ttm.treatmentCode AS treatmentType, 
    vpa.registrationDate,
    (SELECT vda.donarName  
     FROM visit_donars_associations vda 
     WHERE vda.visitId = pva.id 
     LIMIT 1) AS donarName,

    --  donorStatus
    CASE 
        -- Condition 1: If donorBookingAmount > 0
        WHEN vpa.donorBookingAmount > 0 THEN 
            CASE 
                -- If donorBookingDate is NULL -> Payment not done
                WHEN vpa.donorBookingDate IS NULL THEN 0
                -- Else, check if donor exists
                WHEN NOT EXISTS (
                    SELECT 1 
                    FROM visit_donars_associations vda 
                    WHERE vda.visitId = pva.id 
                    LIMIT 1
                ) THEN 1 -- Donor Not Created
                -- Donor exists but required documents missing
                WHEN ${donorHasIncompleteDocumentsCondition} THEN 1
                -- Complete donor, trigger not started
                WHEN NOT EXISTS (
                    SELECT 1 
                    FROM treatment_timestamps tt 
                    WHERE tt.visitId = pva.id 
                    AND (tt.triggerStartDate IS NOT NULL OR tt.triggerStartedBy IS NOT NULL)
                    LIMIT 1
                ) THEN 2
                ELSE 3 -- Donor trigger started
            END
        
        -- Condition 2: If donorBookingAmount is 0 or NULL
        ELSE 
            CASE 
                WHEN NOT EXISTS (
                    SELECT 1 
                    FROM visit_donars_associations vda 
                    WHERE vda.visitId = pva.id 
                    LIMIT 1
                ) THEN 1 -- Donor Not Created
                WHEN ${donorHasIncompleteDocumentsCondition} THEN 1
                WHEN NOT EXISTS (
                    SELECT 1 
                    FROM treatment_timestamps tt 
                    WHERE tt.visitId = pva.id 
                    AND (tt.triggerStartDate IS NOT NULL OR tt.triggerStartedBy IS NOT NULL)
                    LIMIT 1
                ) THEN 2
                ELSE 3 -- Donor trigger started
            END
    END AS donorStatus

FROM patient_visits_association pva
INNER JOIN patient_master pm ON pva.patientId = pm.id
INNER JOIN visit_treatment_cycles_associations vtc ON pva.id = vtc.visitId
INNER JOIN visit_packages_associations vpa ON pva.id = vpa.visitId
INNER JOIN treatment_type_master ttm ON ttm.id = vtc.treatmentTypeId
WHERE vtc.treatmentTypeId IN (6, 7)
AND vpa.registrationDate IS NOT NULL
ORDER BY vpa.registrationDate DESC;
`;

const isPackageExistsQueryForTreatment = `
select ttm.isPackageExists from visit_treatment_cycles_associations vtca 
INNER JOIN treatment_type_master ttm ON ttm.id = vtca.treatmentTypeId 
where vtca.id = :treatmentCycleId
`;

const isPackageExistsQueryForVisit = `
select ttm.isPackageExists from visit_treatment_cycles_associations vtca 
INNER JOIN treatment_type_master ttm ON ttm.id = vtca.treatmentTypeId
where vtca.visitId = :visitId
`;

const UpdateActiveQuery = `update patient_visits_association pva SET isActive=0,
      visitClosedStatus = :visitClosedStatus, 
    visitClosedReason = :visitClosedReason, 
    closedBy = :closedBy  where pva.id=:visitId`;

const donorPaymentCheckQuery = `
SELECT 
    CASE 
        WHEN donorBookingAmount > 0 THEN 
            CASE 
                WHEN donorBookingDate IS NULL THEN 0 
                ELSE 1 
            END
        ELSE 1 
    END AS donorBookingCheck
FROM visit_packages_associations
WHERE visitId = :visitId;
`;

module.exports = {
  isActiveQuery,
  getDonarInformationQuery,
  isPackageExistsQueryForTreatment,
  UpdateActiveQuery,
  isPackageExistsQueryForVisit,
  donorPaymentCheckQuery
};
