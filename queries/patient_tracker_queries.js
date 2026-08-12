/**
 * Lean Patient Tracker Summary Automated query.
 * Filters by registration date (and optional branch) server-side,
 * joins package financials + maps clinical dates from package milestones,
 * OT list, treatment timestamps, and patient_tracker overlays.
 */
const getPatientTrackerSummaryAutomatedQuery = `
SELECT
    base.*,
    CASE
        WHEN base.latestTreatmentName = '-' OR base.latestTreatmentName IS NULL OR TRIM(base.latestTreatmentName) = '' THEN '-'
        WHEN UPPER(TRIM(base.latestTreatmentName)) LIKE '%OI%TI%' OR UPPER(TRIM(base.latestTreatmentName)) LIKE '%TI%OI%' THEN 'OI + TI'
        WHEN UPPER(TRIM(base.latestTreatmentName)) LIKE '%IUI%' THEN 'IUI'
        WHEN UPPER(TRIM(base.latestTreatmentName)) LIKE '%ICSI%' THEN 'IVF'
        ELSE '-'
    END AS treatmentType,
    GREATEST(
        COALESCE(base.marketingPackage, 0) - COALESCE(base.paidAmount, 0),
        0
    ) AS pendingAmount
FROM (
    SELECT
        pm.id,
        pm.patientId,
        pm.branchId,
        (SELECT bm.branchCode FROM branch_master bm WHERE bm.id = pm.branchId) AS branch,
        CAST(pm.createdAt AS DATE) AS registeredDate,
        pm.createdAt,
        pm.mobileNo,
        CONCAT(pm.lastName, ' ', pm.firstName) AS Name,
        pm.referralName,
        JSON_OBJECT(
            'id', pm.referralId,
            'referralSource', COALESCE(rtm.name, '')
        ) AS referralSource,
        /* Latest treatment name (drives Treatment Type column) */
        COALESCE(
            (
                SELECT ttm.name
                FROM visit_treatment_cycles_associations vtca
                INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
                INNER JOIN treatment_type_master ttm ON ttm.id = vtca.treatmentTypeId
                WHERE pva.patientId = pm.id AND pva.isActive = 1
                ORDER BY vtca.createdAt DESC
                LIMIT 1
            ),
            (
                SELECT ttm.name
                FROM visit_treatment_cycles_associations vtca
                INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
                INNER JOIN treatment_type_master ttm ON ttm.id = vtca.treatmentTypeId
                WHERE pva.patientId = pm.id
                ORDER BY vtca.createdAt DESC
                LIMIT 1
            ),
            '-'
        ) AS latestTreatmentName,
        /* All treatment cycles incl. previous Failed / Cancelled — display string */
        COALESCE(
            (
                SELECT GROUP_CONCAT(
                    CONCAT(
                        ttm.name,
                        ' (',
                        CASE
                            WHEN UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) LIKE '%UPT_NEGATIVE%'
                              OR UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) LIKE '%UPT NEGATIVE%'
                              OR UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) = 'NEGATIVE'
                                THEN 'Failed'
                            WHEN UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) LIKE '%CANCEL%'
                                THEN 'Cancelled'
                            WHEN UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) LIKE '%UPT_POSITIVE%'
                              OR UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) LIKE '%UPT POSITIVE%'
                              OR UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) = 'POSITIVE'
                                THEN 'Success'
                            WHEN UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) LIKE '%FREEZE%'
                                THEN 'Freeze All'
                            WHEN tt.endDate IS NOT NULL OR tt.fetEndedDate IS NOT NULL
                                THEN 'Ended'
                            WHEN pva.isActive = 1 THEN 'Active'
                            ELSE 'Previous'
                        END,
                        ')'
                    )
                    ORDER BY
                        CASE WHEN pva.isActive = 1 THEN 0 ELSE 1 END,
                        vtca.createdAt DESC
                    SEPARATOR ', '
                )
                FROM visit_treatment_cycles_associations vtca
                INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
                INNER JOIN treatment_type_master ttm ON ttm.id = vtca.treatmentTypeId
                LEFT JOIN treatment_timestamps tt
                    ON tt.visitId = vtca.visitId
                   AND tt.treatmentType = vtca.treatmentTypeId
                WHERE pva.patientId = pm.id
            ),
            '-'
        ) AS plan,
        /* Structured history for chip UI */
        (
            SELECT CONCAT(
                '[',
                GROUP_CONCAT(
                    JSON_OBJECT(
                        'name', ttm.name,
                        'status',
                        CASE
                            WHEN UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) LIKE '%UPT_NEGATIVE%'
                              OR UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) LIKE '%UPT NEGATIVE%'
                              OR UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) = 'NEGATIVE'
                                THEN 'Failed'
                            WHEN UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) LIKE '%CANCEL%'
                                THEN 'Cancelled'
                            WHEN UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) LIKE '%UPT_POSITIVE%'
                              OR UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) LIKE '%UPT POSITIVE%'
                              OR UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) = 'POSITIVE'
                                THEN 'Success'
                            WHEN UPPER(COALESCE(tt.endedReason, tt.fetEndedReason, '')) LIKE '%FREEZE%'
                                THEN 'Freeze All'
                            WHEN tt.endDate IS NOT NULL OR tt.fetEndedDate IS NOT NULL
                                THEN 'Ended'
                            WHEN pva.isActive = 1 THEN 'Active'
                            ELSE 'Previous'
                        END,
                        'isActive', pva.isActive,
                        'date', DATE_FORMAT(vtca.createdAt, '%Y-%m-%d')
                    )
                    ORDER BY
                        CASE WHEN pva.isActive = 1 THEN 0 ELSE 1 END,
                        vtca.createdAt DESC
                    SEPARATOR ','
                ),
                ']'
            )
            FROM visit_treatment_cycles_associations vtca
            INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
            INNER JOIN treatment_type_master ttm ON ttm.id = vtca.treatmentTypeId
            LEFT JOIN treatment_timestamps tt
                ON tt.visitId = vtca.visitId
               AND tt.treatmentType = vtca.treatmentTypeId
            WHERE pva.patientId = pm.id
        ) AS planHistory,
        /* Visit type from patient visit (not appointments) */
        COALESCE(
            (
                SELECT vtm.name
                FROM patient_visits_association pva
                INNER JOIN visit_type_master vtm ON vtm.id = pva.type
                WHERE pva.patientId = pm.id AND pva.isActive = 1
                ORDER BY pva.createdAt DESC
                LIMIT 1
            ),
            (
                SELECT vtm.name
                FROM patient_visits_association pva
                INNER JOIN visit_type_master vtm ON vtm.id = pva.type
                WHERE pva.patientId = pm.id
                ORDER BY pva.createdAt DESC
                LIMIT 1
            ),
            '-'
        ) AS visitType,
        COALESCE(
            (
                SELECT DATE_FORMAT(MAX(caa.appointmentDate), '%d-%m-%Y')
                FROM consultation_appointments_associations caa
                INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
                INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
                WHERE pva.patientId = pm.id
                  AND pva.isActive = 1
                  AND vca.type = 'FollowUp Consultation'
                  AND CAST(caa.appointmentDate AS DATE) >= CAST(CURRENT_DATE AS DATE)
            ),
            (
                SELECT DATE_FORMAT(MAX(caa.appointmentDate), '%d-%m-%Y')
                FROM consultation_appointments_associations caa
                INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
                INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
                WHERE pva.patientId = pm.id
                  AND vca.type = 'FollowUp Consultation'
                  AND CAST(caa.appointmentDate AS DATE) >= CAST(CURRENT_DATE AS DATE)
            ),
            '-'
        ) AS stageOfCycle,
        COALESCE(
            pkg.activeVisitId,
            (
                SELECT pva.id
                FROM patient_visits_association pva
                WHERE pva.patientId = pm.id
                ORDER BY CASE WHEN pva.isActive = 1 THEN 0 ELSE 1 END, pva.createdAt DESC
                LIMIT 1
            )
        ) AS activeVisitId,
        pkg.packageVisitId,
        COALESCE(pkg.doctorSuggestedPackage, 0) AS doctorSuggestedPackage,
        COALESCE(pkg.marketingPackage, 0) AS marketingPackage,
        COALESCE(pkg.registrationAmount, 0) AS registrationAmount,
        COALESCE(
            (
                SELECT SUM(paid.totalPaid)
                FROM (
                    SELECT COALESCE(SUM(tom.paidOrderAmountBeforeDiscount), 0) AS totalPaid
                    FROM treatment_orders_master tom
                    WHERE tom.visitId = COALESCE(pkg.packageVisitId, pkg.activeVisitId)
                      AND tom.paymentStatus = 'PAID'
                    UNION ALL
                    SELECT COALESCE(SUM(opom.paidOrderAmountBeforeDiscount), 0) AS totalPaid
                    FROM patient_other_payment_associations popa
                    INNER JOIN other_payment_orders_master opom ON opom.refId = popa.id
                    WHERE popa.patientId = pm.id
                      AND opom.paymentStatus = 'PAID'
                      AND LOWER(popa.appointmentReason) LIKE 'ivf package%'
                ) paid
            ),
            0
        ) AS paidAmount,

        /* ICSI-D1: package day1Date (ICSI types) → treatment_timestamps.startDate → tracker */
        COALESCE(
            NULLIF(DATE_FORMAT(pkg.day1Date, '%Y-%m-%d'), ''),
            (
                SELECT DATE_FORMAT(tt.startDate, '%Y-%m-%d')
                FROM treatment_timestamps tt
                WHERE tt.visitId = COALESCE(pkg.packageVisitId, pkg.activeVisitId)
                  AND tt.startDate IS NOT NULL
                ORDER BY tt.id DESC
                LIMIT 1
            ),
            NULLIF(DATE_FORMAT(pt.icsiD1, '%Y-%m-%d'), '')
        ) AS icsiD1,

        /* OPU: package pickUpDate → OT PickUp/OPU → tracker */
        COALESCE(
            NULLIF(DATE_FORMAT(pkg.pickUpDate, '%Y-%m-%d'), ''),
            (
                SELECT DATE_FORMAT(olm.procedureDate, '%Y-%m-%d')
                FROM ot_list_master olm
                INNER JOIN visit_treatment_cycles_associations vtca
                    ON vtca.id = olm.treatmentCycleId
                INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
                WHERE pva.patientId = pm.id
                  AND (
                    LOWER(REPLACE(olm.procedureName, ' ', '')) LIKE '%pickup%'
                    OR LOWER(REPLACE(olm.procedureName, ' ', '')) LIKE '%opu%'
                  )
                ORDER BY olm.procedureDate DESC, olm.id DESC
                LIMIT 1
            ),
            NULLIF(DATE_FORMAT(pt.opu, '%Y-%m-%d'), '')
        ) AS opu,

        /* FET-D1: package fetDate → treatment_timestamps.fetStartDate → tracker */
        COALESCE(
            NULLIF(DATE_FORMAT(pkg.fetDate, '%Y-%m-%d'), ''),
            (
                SELECT DATE_FORMAT(tt.fetStartDate, '%Y-%m-%d')
                FROM treatment_timestamps tt
                WHERE tt.visitId = COALESCE(pkg.packageVisitId, pkg.activeVisitId)
                  AND tt.fetStartDate IS NOT NULL
                ORDER BY tt.id DESC
                LIMIT 1
            ),
            NULLIF(DATE_FORMAT(pt.fetD1, '%Y-%m-%d'), '')
        ) AS fetD1,

        /* FET: treatment_timestamps.fetEndedDate → tracker */
        COALESCE(
            (
                SELECT DATE_FORMAT(tt.fetEndedDate, '%Y-%m-%d')
                FROM treatment_timestamps tt
                WHERE tt.visitId = COALESCE(pkg.packageVisitId, pkg.activeVisitId)
                  AND tt.fetEndedDate IS NOT NULL
                ORDER BY tt.id DESC
                LIMIT 1
            ),
            NULLIF(DATE_FORMAT(pt.fet, '%Y-%m-%d'), '')
        ) AS fet,

        /* UPT: tracker first, else Positive if uptPositiveDate exists */
        COALESCE(
            NULLIF(pt.uptResult, ''),
            CASE
                WHEN pkg.uptPositiveDate IS NOT NULL THEN 'Positive'
                ELSE NULL
            END
        ) AS uptResult,
        pt.uptManualEntry AS uptManualEntry,

        COALESCE(pt.numberOfEmbryos, 0) AS numberOfEmbryos,
        COALESCE(pt.numberOfEmbryosUsed, 0) AS numberOfEmbryosUsed,
        COALESCE(pt.numberOfEmbryosDiscarded, 0) AS numberOfEmbryosDiscarded,
        COALESCE(
            pt.embryosRemaining,
            GREATEST(
                COALESCE(pt.numberOfEmbryos, 0) - COALESCE(pt.numberOfEmbryosUsed, 0),
                0
            )
        ) AS embryosRemaining,
        pt.lastRenewalDate AS lastRenewalDate,
        pt.cycleStatus AS trackerCycleStatus,
        pt.stageOfCycle AS trackerStageOfCycle
    FROM patient_master pm
    LEFT JOIN referral_type_master rtm ON rtm.id = pm.referralId
    LEFT JOIN (
        SELECT
            ranked.patientId,
            ranked.activeVisitId,
            ranked.packageVisitId,
            ranked.doctorSuggestedPackage,
            ranked.marketingPackage,
            ranked.registrationAmount,
            ranked.day1Date,
            ranked.pickUpDate,
            ranked.fetDate,
            ranked.uptPositiveDate
        FROM (
            SELECT
                pva.patientId,
                (
                    SELECT pva2.id
                    FROM patient_visits_association pva2
                    WHERE pva2.patientId = pva.patientId AND pva2.isActive = 1
                    ORDER BY pva2.createdAt DESC
                    LIMIT 1
                ) AS activeVisitId,
                vpa.visitId AS packageVisitId,
                vpa.doctorSuggestedPackage,
                vpa.marketingPackage,
                vpa.registrationAmount,
                vpa.day1Date,
                vpa.pickUpDate,
                vpa.fetDate,
                vpa.uptPositiveDate,
                ROW_NUMBER() OVER (
                    PARTITION BY pva.patientId
                    ORDER BY
                        CASE WHEN pva.isActive = 1 THEN 0 ELSE 1 END,
                        pva.createdAt DESC,
                        vpa.id DESC
                ) AS rn
            FROM patient_visits_association pva
            INNER JOIN visit_packages_associations vpa ON vpa.visitId = pva.id
            INNER JOIN patient_master pm_pkg ON pm_pkg.id = pva.patientId
            WHERE CAST(pm_pkg.createdAt AS DATE) BETWEEN :fromDate AND :toDate
        ) ranked
        WHERE ranked.rn = 1
    ) pkg ON pkg.patientId = pm.id
    LEFT JOIN (
        SELECT pt1.*
        FROM patient_tracker pt1
        INNER JOIN (
            SELECT patientId, MAX(id) AS maxId
            FROM patient_tracker
            GROUP BY patientId
        ) latest ON latest.maxId = pt1.id
    ) pt ON pt.patientId COLLATE utf8mb4_unicode_ci = pm.patientId COLLATE utf8mb4_unicode_ci
    WHERE CAST(pm.createdAt AS DATE) BETWEEN :fromDate AND :toDate
      {branchFilter}
) base
ORDER BY base.createdAt ASC
`;

module.exports = {
  getPatientTrackerSummaryAutomatedQuery
};
