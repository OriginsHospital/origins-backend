const getAllCouponList = `
SELECT 
cm.id,
cm.couponCode, cm.discountPercentage, cm.isActive, CAST(cm.createdAt AS DATE) as createdAt,
u.fullName as createdBy
from coupon_master cm INNER JOIN users u on u.id = cm.createdBy;
`

module.exports = {
    getAllCouponList
}