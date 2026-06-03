-- Align HYFOSY KIT medicine name with pharmacy item_master (DROTVIN M).
UPDATE pharmacy_kit_master
SET medicines = REPLACE(
  CAST(medicines AS CHAR),
  '"name": "DROTIN-M TAB"',
  '"name": "DROTVIN M"'
)
WHERE kitValue = 'HYFOSY_KIT'
  AND CAST(medicines AS CHAR) LIKE '%DROTIN-M TAB%';
