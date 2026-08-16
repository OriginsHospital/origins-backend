/**
 * Lean Patient Tracker Summary Automated query.
 * Filters by registration date (and optional branch) server-side,
 * joins ACTIVE visit package financials + clinical dates from that package,
 * active-visit OT list, and active-visit treatment timestamps.
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
    ) AS pendingAmount,
    /* Live journey: Registered → Initial Appointment → Follow up → treatment milestones */
    CASE
        WHEN UPPER(TRIM(COALESCE(base.uptResult, ''))) = 'POSITIVE' THEN 'UPT Positive'
        WHEN UPPER(TRIM(COALESCE(base.uptResult, ''))) = 'NEGATIVE' THEN 'UPT Negative'
        WHEN UPPER(TRIM(COALESCE(base.uptResult, ''))) NOT IN ('', 'OTHERS', '-')
            AND base.uptResult IS NOT NULL THEN 'UPT'
        WHEN base.fet IS NOT NULL AND TRIM(base.fet) != '' THEN 'FET'
        WHEN base.fetD1 IS NOT NULL AND TRIM(base.fetD1) != '' THEN 'FET-D1'
        WHEN base.opu IS NOT NULL AND TRIM(base.opu) != '' THEN 'OPU'
        WHEN base.icsiD1 IS NOT NULL AND TRIM(base.icsiD1) != '' THEN 'Cycle Started'
        WHEN base.latestTreatmentName IS NOT NULL
            AND TRIM(base.latestTreatmentName) != ''
            AND base.latestTreatmentName != '-' THEN 'Treatment'
        WHEN base.appointmentStage IS NOT NULL THEN base.appointmentStage
        ELSE 'Registered'
    END AS stageOfCycle
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
        /* Active visit treatment only (do not fall back to closed/old cycles) */
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
        /* Furthest consultation stage: Follow up > Initial Appointment */
        (
            SELECT
                CASE
                    WHEN SUM(CASE WHEN vca.type LIKE '%Follow%' THEN 1 ELSE 0 END) > 0
                        THEN 'Follow up'
                    WHEN COUNT(caa.id) >= 2
                        THEN 'Follow up'
                    WHEN SUM(CASE WHEN vca.type LIKE '%nitial%' THEN 1 ELSE 0 END) > 0
                        THEN 'Initial Appointment'
                    WHEN COUNT(caa.id) > 0
                        THEN 'Initial Appointment'
                    ELSE NULL
                END
            FROM consultation_appointments_associations caa
            INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
            INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
            WHERE pva.patientId = pm.id
        ) AS appointmentStage,
        COALESCE(
            pkg.activeVisitId,
            (
                SELECT pva.id
                FROM patient_visits_association pva
                WHERE pva.patientId = pm.id AND pva.isActive = 1
                ORDER BY pva.createdAt DESC
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
                      AND popa.createdAt >= (
                          SELECT pva.createdAt
                          FROM patient_visits_association pva
                          WHERE pva.id = COALESCE(pkg.packageVisitId, pkg.activeVisitId)
                      )
                ) paid
            ),
            0
        ) AS paidAmount,

        /* ICSI-D1 from active package / active visit only */
        COALESCE(
            NULLIF(DATE_FORMAT(pkg.day1Date, '%Y-%m-%d'), ''),
            (
                SELECT DATE_FORMAT(tt.startDate, '%Y-%m-%d')
                FROM treatment_timestamps tt
                WHERE tt.visitId = COALESCE(pkg.packageVisitId, pkg.activeVisitId)
                  AND tt.startDate IS NOT NULL
                ORDER BY tt.id DESC
                LIMIT 1
            )
        ) AS icsiD1,

        /* OPU from active package / active visit OT list only */
        COALESCE(
            NULLIF(DATE_FORMAT(pkg.pickUpDate, '%Y-%m-%d'), ''),
            (
                SELECT DATE_FORMAT(olm.procedureDate, '%Y-%m-%d')
                FROM ot_list_master olm
                INNER JOIN visit_treatment_cycles_associations vtca
                    ON vtca.id = olm.treatmentCycleId
                INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
                WHERE pva.patientId = pm.id
                  AND pva.isActive = 1
                  AND (
                    LOWER(REPLACE(olm.procedureName, ' ', '')) LIKE '%pickup%'
                    OR LOWER(REPLACE(olm.procedureName, ' ', '')) LIKE '%opu%'
                  )
                ORDER BY olm.procedureDate DESC, olm.id DESC
                LIMIT 1
            )
        ) AS opu,

        /* FET-D1 from active package / active visit only */
        COALESCE(
            NULLIF(DATE_FORMAT(pkg.fetDate, '%Y-%m-%d'), ''),
            (
                SELECT DATE_FORMAT(tt.fetStartDate, '%Y-%m-%d')
                FROM treatment_timestamps tt
                WHERE tt.visitId = COALESCE(pkg.packageVisitId, pkg.activeVisitId)
                  AND tt.fetStartDate IS NOT NULL
                ORDER BY tt.id DESC
                LIMIT 1
            )
        ) AS fetD1,

        /* FET from active visit only */
        (
            SELECT DATE_FORMAT(tt.fetEndedDate, '%Y-%m-%d')
            FROM treatment_timestamps tt
            WHERE tt.visitId = COALESCE(pkg.packageVisitId, pkg.activeVisitId)
              AND tt.fetEndedDate IS NOT NULL
            ORDER BY tt.id DESC
            LIMIT 1
        ) AS fet,

        /* UPT from active package milestone only */
        CASE
            WHEN pkg.uptPositiveDate IS NOT NULL THEN 'Positive'
            ELSE NULL
        END AS uptResult,
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
        COALESCE(lastApptNotes.notes, '') AS notes,
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
                pva.id AS activeVisitId,
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
                    ORDER BY pva.createdAt DESC, vpa.id DESC
                ) AS rn
            FROM patient_visits_association pva
            INNER JOIN visit_packages_associations vpa ON vpa.visitId = pva.id
            INNER JOIN patient_master pm_pkg ON pm_pkg.id = pva.patientId
            WHERE CAST(pm_pkg.createdAt AS DATE) BETWEEN :fromDate AND :toDate
              AND pva.isActive = 1
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
    LEFT JOIN (
        SELECT
            latest.patientId,
            (
                SELECT cana.notes
                FROM consultation_appointment_notes_associations cana
                WHERE cana.appointmentId = latest.appointmentId
                  AND COALESCE(cana.isSpouse, 0) = 0
                ORDER BY cana.id DESC
                LIMIT 1
            ) AS notes
        FROM (
            SELECT
                pva.patientId,
                caa.id AS appointmentId,
                ROW_NUMBER() OVER (
                    PARTITION BY pva.patientId
                    ORDER BY caa.appointmentDate DESC, caa.id DESC
                ) AS rn
            FROM consultation_appointments_associations caa
            INNER JOIN visit_consultations_associations vca
                ON vca.id = caa.consultationId
            INNER JOIN patient_visits_association pva
                ON pva.id = vca.visitId
            INNER JOIN patient_master pm_n
                ON pm_n.id = pva.patientId
            WHERE CAST(pm_n.createdAt AS DATE) BETWEEN :fromDate AND :toDate
        ) latest
        WHERE latest.rn = 1
    ) lastApptNotes ON lastApptNotes.patientId = pm.id
    WHERE CAST(pm.createdAt AS DATE) BETWEEN :fromDate AND :toDate
      {branchFilter}
) base
ORDER BY base.createdAt ASC
`;

module.exports = {
  getPatientTrackerSummaryAutomatedQuery
};
