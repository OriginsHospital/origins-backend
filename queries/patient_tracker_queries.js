/**
 * Lean Patient Tracker Summary Automated query.
 * Filters by registration date (and optional branch) server-side,
 * and joins package + paid amounts in one round-trip.
 */
const getPatientTrackerSummaryAutomatedQuery = `
SELECT
    base.*,
    CASE
        WHEN base.plan = '-' OR base.plan IS NULL OR TRIM(base.plan) = '' THEN '-'
        WHEN UPPER(TRIM(base.plan)) LIKE '%OI%TI%' OR UPPER(TRIM(base.plan)) LIKE '%TI%OI%' THEN 'OI + TI'
        WHEN UPPER(TRIM(base.plan)) LIKE '%IUI%' THEN 'IUI'
        WHEN UPPER(TRIM(base.plan)) LIKE '%ICSI%' THEN 'IVF'
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
        ) AS plan,
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
        pkg.activeVisitId,
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
                    WHERE tom.visitId = pkg.packageVisitId
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
        ) AS paidAmount
    FROM patient_master pm
    LEFT JOIN referral_type_master rtm ON rtm.id = pm.referralId
    LEFT JOIN (
        SELECT
            ranked.patientId,
            ranked.activeVisitId,
            ranked.packageVisitId,
            ranked.doctorSuggestedPackage,
            ranked.marketingPackage,
            ranked.registrationAmount
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
    WHERE CAST(pm.createdAt AS DATE) BETWEEN :fromDate AND :toDate
      {branchFilter}
) base
ORDER BY base.createdAt ASC
`;

module.exports = {
  getPatientTrackerSummaryAutomatedQuery
};
