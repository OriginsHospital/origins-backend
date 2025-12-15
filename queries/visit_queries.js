const isActiveQuery = `SELECT COUNT(*) as activeCount FROM patient_visits_association WHERE patientId = :patientId AND isActive = 1`;
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
                -- If donor exists, check treatment trigger
                WHEN NOT EXISTS (
                    SELECT 1 
                    FROM treatment_timestamps tt 
                    WHERE tt.visitId = pva.id 
                    LIMIT 1
                ) THEN 2 -- Donor Created but treatment not triggered
                ELSE 3 -- Treatment Triggered
            END
        
        -- Condition 2: If donorBookingAmount is 0 or NULL
        ELSE 
            CASE 
                -- Check if donor exists
                WHEN NOT EXISTS (
                    SELECT 1 
                    FROM visit_donars_associations vda 
                    WHERE vda.visitId = pva.id 
                    LIMIT 1
                ) THEN 1 -- Donor Not Created
                -- If donor exists, check treatment trigger
                WHEN NOT EXISTS (
                    SELECT 1 
                    FROM treatment_timestamps tt 
                    WHERE tt.visitId = pva.id 
                    LIMIT 1
                ) THEN 2 -- Donor Created but treatment not triggered
                ELSE 3 -- Treatment Triggered
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
