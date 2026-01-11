-- =============================================
-- Patient Tracker Queries (INSERT, SELECT, UPDATE, DELETE)
-- =============================================
-- Date: 2025-01-15
-- =============================================

-- =============================================
-- INSERT Query - Save Patient Tracker Data
-- =============================================
INSERT INTO patient_tracker (
    date,
    branchId,
    patientId,
    patientName,
    mobileNumber,
    referralSourceId,
    referralName,
    plan,
    treatmentType,
    cycleStatus,
    stageOfCycle,
    packageName,
    packageAmount,
    registrationAmount,
    paidAmount,
    pendingAmount,
    numberOfEmbryos,
    numberOfEmbryosUsed,
    numberOfEmbryosDiscarded,
    lastRenewalDate,
    embryosRemaining,
    uptResult,
    uptManualEntry,
    createdBy,
    updatedBy
) VALUES (
    :date,                                  -- '2025-01-15'
    :branchId,                              -- 1
    :patientId,                             -- 'ORI000013'
    :patientName,                           -- 'John Doe'
    :mobileNumber,                          -- '9876543210'
    :referralSourceId,                      -- 1 (NULL if not selected)
    :referralName,                          -- 'Dr. Smith' (NULL if referralSourceId is NULL)
    :plan,                                  -- 'Plan A' (NULL if empty)
    :treatmentType,                         -- 'IVF'
    :cycleStatus,                           -- 'Running'
    :stageOfCycle,                          -- 'Stage 2' (NULL if empty)
    :packageName,                           -- 'Premium Package'
    :packageAmount,                         -- 50000.00
    :registrationAmount,                    -- 5000.00
    :paidAmount,                            -- 10000.00
    (:packageAmount - COALESCE(:paidAmount, 0)), -- 40000.00 (calculated)
    :numberOfEmbryos,                       -- 5
    :numberOfEmbryosUsed,                   -- 2
    COALESCE(:numberOfEmbryosDiscarded, 0), -- 0
    :lastRenewalDate,                       -- '2025-01-10' (NULL if empty)
    (:numberOfEmbryos - COALESCE(:numberOfEmbryosUsed, 0)), -- 3 (calculated)
    :uptResult,                             -- 'Positive'
    :uptManualEntry,                        -- NULL (or text if uptResult = 'Others')
    :createdBy,                             -- 1 (user ID)
    :updatedBy                              -- 1 (user ID)
);

-- =============================================
-- SELECT Query - Get Patient Tracker Records with Filters
-- =============================================
SELECT 
    pt.id,
    pt.date,
    pt.branchId,
    bm.name AS branchName,
    bm.branchCode AS branchCode,
    pt.patientId,
    pt.patientName,
    pt.mobileNumber,
    pt.referralSourceId,
    rtm.name AS referralSourceName,
    pt.referralName,
    pt.plan,
    pt.treatmentType,
    pt.cycleStatus,
    pt.stageOfCycle,
    pt.packageName,
    pt.packageAmount,
    pt.registrationAmount,
    pt.paidAmount,
    pt.pendingAmount,
    pt.numberOfEmbryos,
    pt.numberOfEmbryosUsed,
    pt.numberOfEmbryosDiscarded,
    pt.lastRenewalDate,
    pt.embryosRemaining,
    pt.uptResult,
    pt.uptManualEntry,
    pt.createdBy,
    u1.fullName AS createdByName,
    pt.updatedBy,
    u2.fullName AS updatedByName,
    pt.createdAt,
    pt.updatedAt
FROM patient_tracker pt
LEFT JOIN branch_master bm ON bm.id = pt.branchId
LEFT JOIN referral_type_master rtm ON rtm.id = pt.referralSourceId
LEFT JOIN users u1 ON u1.id = pt.createdBy
LEFT JOIN users u2 ON u2.id = pt.updatedBy
WHERE 
    (:fromDate IS NULL OR pt.date >= :fromDate)
    AND (:toDate IS NULL OR pt.date <= :toDate)
    AND (:branchId IS NULL OR pt.branchId = :branchId)
    AND (:patientId IS NULL OR pt.patientId LIKE CONCAT('%', :patientId, '%'))
    AND (:treatmentType IS NULL OR pt.treatmentType = :treatmentType)
    AND (:cycleStatus IS NULL OR pt.cycleStatus = :cycleStatus)
ORDER BY pt.date DESC, pt.createdAt DESC;

-- =============================================
-- SELECT Query - Get Patient Tracker by ID
-- =============================================
SELECT 
    pt.*,
    bm.name AS branchName,
    bm.branchCode AS branchCode,
    rtm.name AS referralSourceName,
    u1.fullName AS createdByName,
    u2.fullName AS updatedByName
FROM patient_tracker pt
LEFT JOIN branch_master bm ON bm.id = pt.branchId
LEFT JOIN referral_type_master rtm ON rtm.id = pt.referralSourceId
LEFT JOIN users u1 ON u1.id = pt.createdBy
LEFT JOIN users u2 ON u2.id = pt.updatedBy
WHERE pt.id = :id;

-- =============================================
-- UPDATE Query - Update Patient Tracker Data
-- =============================================
UPDATE patient_tracker 
SET 
    date = :date,
    branchId = :branchId,
    patientId = :patientId,
    patientName = :patientName,
    mobileNumber = :mobileNumber,
    referralSourceId = :referralSourceId,
    referralName = :referralName,
    plan = :plan,
    treatmentType = :treatmentType,
    cycleStatus = :cycleStatus,
    stageOfCycle = :stageOfCycle,
    packageName = :packageName,
    packageAmount = :packageAmount,
    registrationAmount = :registrationAmount,
    paidAmount = :paidAmount,
    pendingAmount = (:packageAmount - :paidAmount),
    numberOfEmbryos = :numberOfEmbryos,
    numberOfEmbryosUsed = :numberOfEmbryosUsed,
    numberOfEmbryosDiscarded = :numberOfEmbryosDiscarded,
    lastRenewalDate = :lastRenewalDate,
    embryosRemaining = (:numberOfEmbryos - :numberOfEmbryosUsed),
    uptResult = :uptResult,
    uptManualEntry = :uptManualEntry,
    updatedBy = :updatedBy,
    updatedAt = CURRENT_TIMESTAMP
WHERE id = :id;

-- =============================================
-- DELETE Query - Delete Patient Tracker Record (Soft Delete Recommended)
-- =============================================
-- Instead of hard delete, consider adding an 'isActive' or 'isDeleted' column
-- DELETE FROM patient_tracker WHERE id = :id;

-- =============================================
-- SELECT Query - Get Summary Statistics
-- =============================================
SELECT 
    COUNT(*) AS totalRecords,
    COUNT(DISTINCT pt.patientId) AS totalPatients,
    COUNT(DISTINCT pt.branchId) AS totalBranches,
    SUM(pt.packageAmount) AS totalPackageAmount,
    SUM(pt.paidAmount) AS totalPaidAmount,
    SUM(pt.pendingAmount) AS totalPendingAmount,
    COUNT(CASE WHEN pt.cycleStatus = 'Complete' THEN 1 END) AS completedCycles,
    COUNT(CASE WHEN pt.cycleStatus = 'Running' THEN 1 END) AS runningCycles,
    COUNT(CASE WHEN pt.uptResult = 'Positive' THEN 1 END) AS positiveUPT,
    COUNT(CASE WHEN pt.uptResult = 'Negative' THEN 1 END) AS negativeUPT
FROM patient_tracker pt
WHERE 
    (:fromDate IS NULL OR pt.date >= :fromDate)
    AND (:toDate IS NULL OR pt.date <= :toDate)
    AND (:branchId IS NULL OR pt.branchId = :branchId);

-- =============================================
-- SELECT Query - Get Patient Tracker by Patient ID (Patient History)
-- =============================================
SELECT 
    pt.*,
    bm.name AS branchName,
    bm.branchCode AS branchCode,
    rtm.name AS referralSourceName
FROM patient_tracker pt
LEFT JOIN branch_master bm ON bm.id = pt.branchId
LEFT JOIN referral_type_master rtm ON rtm.id = pt.referralSourceId
WHERE pt.patientId = :patientId
ORDER BY pt.date DESC, pt.createdAt DESC;

