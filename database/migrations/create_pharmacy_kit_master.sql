CREATE TABLE IF NOT EXISTS pharmacy_kit_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kitName VARCHAR(255) NOT NULL,
    kitValue VARCHAR(100) NOT NULL,
    medicines JSON NOT NULL,
    isActive TINYINT(1) NOT NULL DEFAULT 1,
    createdBy INT NULL,
    updatedBy INT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_pharmacy_kit_value (kitValue)
);

INSERT INTO pharmacy_kit_master (kitName, kitValue, medicines, isActive, createdBy)
SELECT * FROM (
    SELECT 'CLEO SHOT' AS kitName, 'CLEO_SHOT_KIT' AS kitValue,
        JSON_ARRAY(
            JSON_OBJECT('name', 'MOCELL INJ 600MG', 'quantity', 3),
            JSON_OBJECT('name', 'MUCONICS 2ML', 'quantity', 1),
            JSON_OBJECT('name', 'DS VIT - C 1.5 INJ', 'quantity', 1),
            JSON_OBJECT('name', 'Americano MVI INJ', 'quantity', 1),
            JSON_OBJECT('name', 'Cynocan 12', 'quantity', 1),
            JSON_OBJECT('name', 'MAXX - TRACE', 'quantity', 1),
            JSON_OBJECT('name', 'NIPRO SYRINGE 10ML', 'quantity', 2),
            JSON_OBJECT('name', 'IV CANNULA-22', 'quantity', 1),
            JSON_OBJECT('name', 'NS 100ML', 'quantity', 1),
            JSON_OBJECT('name', 'EASY FIX', 'quantity', 1),
            JSON_OBJECT('name', 'IV SET', 'quantity', 1)
        ) AS medicines, 1 AS isActive, 1 AS createdBy
    UNION ALL SELECT 'NAPO SHOT', 'NAPO_SHOT_KIT',
        JSON_ARRAY(
            JSON_OBJECT('name', 'MOCELL INJ 600MG', 'quantity', 3),
            JSON_OBJECT('name', 'LEVO VEN', 'quantity', 1),
            JSON_OBJECT('name', 'MUCONICS 2ML', 'quantity', 1),
            JSON_OBJECT('name', 'DS VIT - C 1.5 INJ', 'quantity', 1),
            JSON_OBJECT('name', 'Americano MVI INJ', 'quantity', 1),
            JSON_OBJECT('name', 'Cynocan 12', 'quantity', 1),
            JSON_OBJECT('name', 'MAXX - TRACE', 'quantity', 1),
            JSON_OBJECT('name', 'NIPRO SYRINGE 10ML', 'quantity', 2),
            JSON_OBJECT('name', 'IV CANNULA-22', 'quantity', 1),
            JSON_OBJECT('name', 'NS 100ML', 'quantity', 1),
            JSON_OBJECT('name', 'EASY FIX', 'quantity', 1),
            JSON_OBJECT('name', 'IV SET', 'quantity', 1)
        ), 1, 1
    UNION ALL SELECT 'HYFOSY KIT', 'HYFOSY_KIT',
        JSON_ARRAY(
            JSON_OBJECT('name', 'FOLEY CATHETER 10', 'quantity', 1),
            JSON_OBJECT('name', 'LOX-2% JELLY', 'quantity', 1),
            JSON_OBJECT('name', 'NIPRO SYRINGE 10ML', 'quantity', 1),
            JSON_OBJECT('name', 'NS 100ML', 'quantity', 1),
            JSON_OBJECT('name', 'Surgicare 6.5 Glove', 'quantity', 1),
            JSON_OBJECT('name', 'BUSCOGAST INJ', 'quantity', 1),
            JSON_OBJECT('name', 'NIPRO SYRINGE 2.5ML', 'quantity', 2),
            JSON_OBJECT('name', 'ZADY 500MG', 'quantity', 5),
            JSON_OBJECT('name', 'DROTVIN M', 'quantity', 3)
        ), 1, 1
    UNION ALL SELECT 'FLUSH KIT', 'FLUSH_KIT',
        JSON_ARRAY(
            JSON_OBJECT('name', 'EUTRIG-HP 2000 INJ', 'quantity', 1),
            JSON_OBJECT('name', 'NIPRO SYRINGE 2.5ML', 'quantity', 2),
            JSON_OBJECT('name', 'NIPRO SYRINGE 5ML', 'quantity', 1),
            JSON_OBJECT('name', 'DISPOVAN NEEDLE 26', 'quantity', 1),
            JSON_OBJECT('name', 'IUIcatheter', 'quantity', 1),
            JSON_OBJECT('name', 'NS 100ML', 'quantity', 1),
            JSON_OBJECT('name', 'Cleen Care Gloves', 'quantity', 1)
        ), 1, 1
    UNION ALL SELECT 'FLUID ASPIRATIONS KIT', 'FLUID_ASPIRATIONS_KIT',
        JSON_ARRAY(
            JSON_OBJECT('name', 'IUIcatheter', 'quantity', 1),
            JSON_OBJECT('name', 'NIPRO SYRINGE 5ML', 'quantity', 1),
            JSON_OBJECT('name', 'NS 100ML', 'quantity', 1),
            JSON_OBJECT('name', 'Cleen Care Gloves', 'quantity', 1)
        ), 1, 1
    UNION ALL SELECT 'BIOPSY KIT', 'BIOPSY_KIT',
        JSON_ARRAY(
            JSON_OBJECT('name', 'ENDO-PSY CATHETER', 'quantity', 1),
            JSON_OBJECT('name', 'NS 100ML', 'quantity', 1),
            JSON_OBJECT('name', 'Cleen Care Gloves', 'quantity', 1),
            JSON_OBJECT('name', 'BUSCOGAST INJ', 'quantity', 1),
            JSON_OBJECT('name', 'NIPRO SYRINGE 2.5ML', 'quantity', 1)
        ), 1, 1
    UNION ALL SELECT 'OPU KIT', 'OPU_KIT',
        JSON_ARRAY(
            JSON_OBJECT('name', 'IV CANNULA', 'quantity', 1),
            JSON_OBJECT('name', 'IV CANNULA-22', 'quantity', 1),
            JSON_OBJECT('name', 'IV SET', 'quantity', 1),
            JSON_OBJECT('name', 'EASY FIX', 'quantity', 1),
            JSON_OBJECT('name', 'NIPRO SYRINGE 2.5ML', 'quantity', 5),
            JSON_OBJECT('name', 'NIPRO SYRINGE 5ML', 'quantity', 5),
            JSON_OBJECT('name', 'NIPRO SYRINGE 10ML', 'quantity', 3),
            JSON_OBJECT('name', 'NS 100ML', 'quantity', 3),
            JSON_OBJECT('name', 'RL 500ML', 'quantity', 1),
            JSON_OBJECT('name', 'NS 500ML', 'quantity', 1),
            JSON_OBJECT('name', 'FACE MASK', 'quantity', 6),
            JSON_OBJECT('name', 'HEAD CAPS', 'quantity', 6),
            JSON_OBJECT('name', 'UNDER PADS ALL', 'quantity', 1),
            JSON_OBJECT('name', 'TRIMMER', 'quantity', 1),
            JSON_OBJECT('name', 'MONOSET 1GM', 'quantity', 1),
            JSON_OBJECT('name', 'NEOMIT INJ', 'quantity', 1),
            JSON_OBJECT('name', 'PANTOTAZ 40 INJ', 'quantity', 1),
            JSON_OBJECT('name', 'TEXAKIND INJ', 'quantity', 1),
            JSON_OBJECT('name', 'K-STAT INJ', 'quantity', 1),
            JSON_OBJECT('name', 'NEOROF 20ML INJ', 'quantity', 1),
            JSON_OBJECT('name', 'PYROLATE INJ', 'quantity', 1),
            JSON_OBJECT('name', 'SKINTAC 7.5GLOV', 'quantity', 1),
            JSON_OBJECT('name', 'SKINTAC 6.5 GLOV', 'quantity', 1)
        ), 1, 1
    UNION ALL SELECT 'CERVICAL CERCLAGE', 'CERVICAL_CERCLAGE_KIT',
        JSON_ARRAY(
            JSON_OBJECT('name', 'IV SET', 'quantity', 1),
            JSON_OBJECT('name', 'IV CANNULA', 'quantity', 1),
            JSON_OBJECT('name', 'EASY FIX', 'quantity', 1),
            JSON_OBJECT('name', 'MONOCEF 1 GM', 'quantity', 1),
            JSON_OBJECT('name', 'PANTOTAZ 40 INJ', 'quantity', 1),
            JSON_OBJECT('name', 'NEOMIT INJ', 'quantity', 1),
            JSON_OBJECT('name', 'NEOROF 20', 'quantity', 1),
            JSON_OBJECT('name', 'PYROLATE INJ', 'quantity', 1),
            JSON_OBJECT('name', 'K STAT', 'quantity', 1),
            JSON_OBJECT('name', 'TEXAKIND', 'quantity', 1),
            JSON_OBJECT('name', 'FACE MASK', 'quantity', 8),
            JSON_OBJECT('name', 'HEAD CAPS', 'quantity', 8),
            JSON_OBJECT('name', 'UNDER PADS', 'quantity', 1),
            JSON_OBJECT('name', 'NIPRO SYRINGE 5ML', 'quantity', 5),
            JSON_OBJECT('name', 'NIPRO SYRINGE 10ML', 'quantity', 5),
            JSON_OBJECT('name', 'NIPRO SYRINGE 2.5 ML', 'quantity', 5),
            JSON_OBJECT('name', 'SURGICAL GLOVE 6.5', 'quantity', 6),
            JSON_OBJECT('name', 'TRUSILK', 'quantity', 1)
        ), 1, 1
    UNION ALL SELECT 'TRANSFER KIT', 'TRANSFER_KIT',
        JSON_ARRAY(
            JSON_OBJECT('name', 'SKINTAC 6.5 GLOV', 'quantity', 1),
            JSON_OBJECT('name', 'SKINTAC 7.5GLOV', 'quantity', 1),
            JSON_OBJECT('name', 'NS 100ML', 'quantity', 1),
            JSON_OBJECT('name', 'Asthalin 2 mg tab', 'quantity', 2)
        ), 1, 1
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM pharmacy_kit_master LIMIT 1);
