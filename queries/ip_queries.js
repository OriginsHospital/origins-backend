const getIndentDetailsQuery = `
    select ipa.id, CONCAT(pm.lastName, ' ', pm.firstName) as patientName,ipa.indentId, im.itemName, ipa.prescribedQuantity, ipa.prescribedOn, u.fullName as createdBy ,
    ipa.createdAt , ipa.updatedAt  
    from indent_pharmacy_association ipa 
    INNER JOIN procedure_indent_associations pia ON pia.id = ipa.indentId
    INNER JOIN patient_master pm ON pm.id = pia.patientId
    INNER JOIN stockmanagement.item_master im ON im.id = ipa.itemId
    INNER JOIN users u ON u.id = ipa.createdBy
    ORDER BY ipa.updatedAt DESC
`;

module.exports = {
  getIndentDetailsQuery
};
