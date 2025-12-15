const updatePreviousTotalAmountsQuery = `
    UPDATE
	treatment_orders_master tom1
INNER JOIN treatment_orders_master tom2
SET
	tom1.pendingOrderAmount = 0
WHERE
	tom1.id < (
	select
		max(tom2.id)
	where
		tom2.visitId = :visitId)
	and tom1.visitId = :visitId;
`

module.exports = {updatePreviousTotalAmountsQuery};