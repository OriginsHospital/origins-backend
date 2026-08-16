const getIndentDetailsQuery = `
    SELECT
      ipa.id,
      CONCAT(pm.lastName, ' ', pm.firstName) AS patientName,
      ipa.indentId,
      im.itemName,
      ipa.prescribedQuantity,
      ipa.prescribedOn,
      u.fullName AS createdBy,
      ipa.createdAt,
      ipa.updatedAt,
      (
        SELECT ip.roomCode
        FROM ip_master ip
        WHERE ip.patientId = pia.patientId
          AND ip.branchId = :branchId
        ORDER BY ip.isActive DESC, ip.id DESC
        LIMIT 1
      ) AS roomCode,
      :branchId AS branchId
    FROM indent_pharmacy_association ipa
    INNER JOIN procedure_indent_associations pia ON pia.id = ipa.indentId
    INNER JOIN patient_master pm ON pm.id = pia.patientId
    INNER JOIN stockmanagement.item_master im ON im.id = ipa.itemId
    INNER JOIN users u ON u.id = ipa.createdBy
    WHERE EXISTS (
      SELECT 1
      FROM ip_master ip
      WHERE ip.patientId = pia.patientId
        AND ip.branchId = :branchId
    )
    ORDER BY ipa.updatedAt DESC
`;

const getIndentPharmacyItemsQuery = `
    SELECT
      im.id,
      im.itemName,
      COALESCE((
        SELECT IFNULL(SUM(
          CASE
            WHEN CAST(NOW() AS DATE) < gia.expiryDate THEN gia.totalQuantity
            ELSE 0
          END
        ), 0)
        FROM stockmanagement.grn_items_associations gia
        INNER JOIN stockmanagement.grn_master gm ON gm.id = gia.grnId
        WHERE gia.itemId = im.id
          AND IFNULL(gia.isReturned, 0) = 0
          AND gm.branchId = :branchId
      ), 0) AS availableQuantity
    FROM stockmanagement.item_master im
    WHERE im.isActive = 1
      AND EXISTS (
        SELECT 1
        FROM stockmanagement.grn_items_associations gia
        INNER JOIN stockmanagement.grn_master gm ON gm.id = gia.grnId
        WHERE gia.itemId = im.id
          AND IFNULL(gia.isReturned, 0) = 0
          AND gm.branchId = :branchId
          AND gia.totalQuantity > 0
          AND CAST(NOW() AS DATE) < gia.expiryDate
      )
    ORDER BY im.itemName ASC
`;

module.exports = {
  getIndentDetailsQuery,
  getIndentPharmacyItemsQuery
};
