# Update Semen Analysis Template Script

This script updates the Semen Analysis report template to add 5 empty lines below the EMBRYOLOGIST SIGNATURE and DOCTOR SIGNATURE sections.

## Prerequisites

1. Ensure you have Node.js installed
2. Make sure your `.env` file is configured with database credentials:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USERNAME`
   - `MYSQL_PASSWORD`
   - `MYSQL_DBNAME` (for development) or `MYSQL_DBNAME_PROD` (for production)
   - `ENVIRONMENT` (should be 'development' or 'production')

## Usage

1. Navigate to the backend directory:

   ```bash
   cd origins-backend
   ```

2. Run the script:
   ```bash
   node scripts/updateSemenAnalysisTemplate.js
   ```

## What the Script Does

1. Finds the Semen Analysis embryology type in the `embryology_master` table
2. Retrieves the current template from the `embryology_formats` table
3. Adds 5 empty lines (`<br><br><br><br><br>`) below:
   - EMBRYOLOGIST SIGNATURE section
   - DOCTOR SIGNATURE section
4. Updates the template in the database

## Manual Update (Alternative Method)

If you prefer to update the template manually through the admin interface:

1. Go to the Embryology section in your application
2. Select a Semen Analysis report
3. Click "Edit" on the report
4. In the rich text editor, navigate to the signature sections
5. Add 5 empty lines (press Enter 5 times) below:
   - EMBRYOLOGIST SIGNATURE
   - DOCTOR SIGNATURE
6. Save the changes

## Verification

After running the script, verify the changes by:

1. Opening a Semen Analysis report in the application
2. Checking that there are 5 empty lines below each signature section
3. If the changes are not visible, try refreshing the page or clearing the cache

## Troubleshooting

- **"Semen Analysis embryology type not found"**:

  - Check that "Semen Analysis" exists in the `embryology_master` table
  - The script searches for names containing "semen" or "seman" (case-insensitive)

- **"Template not found"**:

  - Ensure that a template entry exists in `embryology_formats` for the Semen Analysis embryology type
  - You may need to create a template first through the admin interface

- **"Could not find signature sections"**:
  - The template structure might be different than expected
  - Check the template HTML structure manually
  - You may need to update the script's pattern matching logic

## Notes

- The script creates a backup by showing the current template before updating
- Make sure to test the updated template in a development environment first
- The empty lines are added using `<br>` tags, which should work in most HTML contexts
