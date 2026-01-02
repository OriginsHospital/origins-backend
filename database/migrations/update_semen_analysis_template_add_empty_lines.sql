-- Migration Script: Add 5 empty lines below signature sections in Semen Analysis template
-- This script updates the embryology_formats table to add 5 empty lines (<br> tags)
-- below EMBRYOLOGIST SIGNATURE and DOCTOR SIGNATURE sections

-- Step 1: Find the Semen Analysis embryology ID
-- Uncomment and run this to find the correct embryologyId:
-- SELECT id, name FROM embryology_master WHERE LOWER(name) LIKE '%semen%' OR LOWER(name) LIKE '%seman%';

-- Step 2: Update the template
-- Replace <EMBRYOLOGY_ID> with the actual ID from Step 1
-- Replace <TEMPLATE_ID> with the actual template ID from embryology_formats table

-- First, let's see the current template structure:
-- SELECT id, embryologyId, LEFT(embryologyTemplate, 500) as template_preview 
-- FROM embryology_formats 
-- WHERE embryologyId = <EMBRYOLOGY_ID>;

-- Update template: Add 5 empty lines after EMBRYOLOGIST SIGNATURE
UPDATE embryology_formats
SET embryologyTemplate = REPLACE(
    embryologyTemplate,
    'EMBRYOLOGIST SIGNATURE</td>',
    'EMBRYOLOGIST SIGNATURE</td><br><br><br><br><br>'
)
WHERE embryologyId IN (
    SELECT id FROM embryology_master 
    WHERE LOWER(name) LIKE '%semen%' OR LOWER(name) LIKE '%seman%'
);

-- Update template: Add 5 empty lines after DOCTOR SIGNATURE
UPDATE embryology_formats
SET embryologyTemplate = REPLACE(
    embryologyTemplate,
    'DOCTOR SIGNATURE</td>',
    'DOCTOR SIGNATURE</td><br><br><br><br><br>'
)
WHERE embryologyId IN (
    SELECT id FROM embryology_master 
    WHERE LOWER(name) LIKE '%semen%' OR LOWER(name) LIKE '%seman%'
);

-- Alternative patterns if the above doesn't work (uncomment as needed):

-- Pattern 2: If signatures are in <div> tags
-- UPDATE embryology_formats
-- SET embryologyTemplate = REPLACE(
--     REPLACE(
--         embryologyTemplate,
--         'EMBRYOLOGIST SIGNATURE</div>',
--         'EMBRYOLOGIST SIGNATURE</div><br><br><br><br><br>'
--     ),
--     'DOCTOR SIGNATURE</div>',
--     'DOCTOR SIGNATURE</div><br><br><br><br><br>'
-- )
-- WHERE embryologyId IN (
--     SELECT id FROM embryology_master 
--     WHERE LOWER(name) LIKE '%semen%' OR LOWER(name) LIKE '%seman%'
-- );

-- Pattern 3: If signatures are in <p> tags
-- UPDATE embryology_formats
-- SET embryologyTemplate = REPLACE(
--     REPLACE(
--         embryologyTemplate,
--         'EMBRYOLOGIST SIGNATURE</p>',
--         'EMBRYOLOGIST SIGNATURE</p><br><br><br><br><br>'
--     ),
--     'DOCTOR SIGNATURE</p>',
--     'DOCTOR SIGNATURE</p><br><br><br><br><br>'
-- )
-- WHERE embryologyId IN (
--     SELECT id FROM embryology_master 
--     WHERE LOWER(name) LIKE '%semen%' OR LOWER(name) LIKE '%seman%'
-- );

-- Verification: Check the updated template
-- SELECT id, embryologyId, 
--        CASE 
--            WHEN embryologyTemplate LIKE '%EMBRYOLOGIST SIGNATURE%<br><br><br><br><br>%' 
--            THEN 'EMBRYOLOGIST SIGNATURE updated ✓'
--            ELSE 'EMBRYOLOGIST SIGNATURE NOT updated ✗'
--        END as embryologist_status,
--        CASE 
--            WHEN embryologyTemplate LIKE '%DOCTOR SIGNATURE%<br><br><br><br><br>%' 
--            THEN 'DOCTOR SIGNATURE updated ✓'
--            ELSE 'DOCTOR SIGNATURE NOT updated ✗'
--        END as doctor_status
-- FROM embryology_formats
-- WHERE embryologyId IN (
--     SELECT id FROM embryology_master 
--     WHERE LOWER(name) LIKE '%semen%' OR LOWER(name) LIKE '%seman%'
-- );

