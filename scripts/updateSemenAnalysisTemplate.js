/**
 * Script to update Semen Analysis report template
 * Adds 5 empty lines below EMBRYOLOGIST SIGNATURE and DOCTOR SIGNATURE sections
 *
 * Usage: node updateSemenAnalysisTemplate.js
 * Make sure to set up environment variables before running
 */

require("dotenv").config();
const MySqlConnection = require("../connections/mysql_connection");
const { Sequelize } = require("sequelize");

async function updateSemenAnalysisTemplate() {
  try {
    // Initialize database connection
    await MySqlConnection.createConnection();
    const connection = MySqlConnection._instance;

    if (!connection) {
      throw new Error("Failed to connect to database");
    }

    // First, find the Semen Analysis embryology ID
    const [embryologyResult] = await connection.query(
      `SELECT id FROM embryology_master WHERE LOWER(name) LIKE '%semen%' OR LOWER(name) LIKE '%seman%' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!embryologyResult || !embryologyResult.id) {
      console.error(
        "Semen Analysis embryology type not found in embryology_master table"
      );
      console.log(
        "Please check the embryology_master table for the correct ID"
      );
      process.exit(1);
    }

    const embryologyId = embryologyResult.id;
    console.log(`Found Semen Analysis with embryologyId: ${embryologyId}`);

    // Get the current template
    const [templateResult] = await connection.query(
      `SELECT id, embryologyTemplate FROM embryology_formats WHERE embryologyId = :embryologyId`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { embryologyId: embryologyId.toString() }
      }
    );

    if (!templateResult) {
      console.error(`Template not found for embryologyId: ${embryologyId}`);
      console.log("Creating a new template entry...");

      // If template doesn't exist, we need to create it
      // But we don't have the original template, so we'll just log an error
      console.error(
        "Template entry does not exist. Please create it first through the admin interface."
      );
      process.exit(1);
    }

    let template = templateResult.embryologyTemplate;
    console.log("Current template retrieved. Updating...");

    // Add 5 empty lines after EMBRYOLOGIST SIGNATURE and DOCTOR SIGNATURE
    // Using <br> tags for empty lines (5 lines = 5 <br> tags)
    const emptyLines = "<br><br><br><br><br>"; // 5 empty lines

    // Function to add empty lines after a signature section
    const addEmptyLinesAfterSignature = (template, signatureText) => {
      // Try multiple patterns to find the signature section
      const patterns = [
        // Pattern 1: Signature text followed by closing tag (most common)
        new RegExp(`(${signatureText}[^<]*<\\/[^>]+>)`, "gi"),
        // Pattern 2: Signature text in a table cell
        new RegExp(`(${signatureText}[^<]*<\\/td>)`, "gi"),
        // Pattern 3: Signature text in a div
        new RegExp(`(${signatureText}[^<]*<\\/div>)`, "gi"),
        // Pattern 4: Signature text in a paragraph
        new RegExp(`(${signatureText}[^<]*<\\/p>)`, "gi"),
        // Pattern 5: Signature text followed by any tag
        new RegExp(`(${signatureText}[^<]*<[^>]+>)`, "gi")
      ];

      let updated = false;
      const originalTemplate = template;

      for (const pattern of patterns) {
        // Try to replace - if pattern doesn't match, template stays the same
        template = template.replace(pattern, match => {
          // Only add if not already added (avoid duplicates)
          if (!match.includes(emptyLines)) {
            updated = true;
            return match + emptyLines;
          }
          return match;
        });

        // If template changed, we found a match
        if (template !== originalTemplate && updated) {
          break;
        }
      }

      // If no pattern matched, try to find the text and add after the next closing tag
      if (!updated && template.includes(signatureText)) {
        const index = template.indexOf(signatureText);
        if (index !== -1) {
          // Find the next closing tag after the signature text
          const afterSignature = template.substring(index);
          const closingTagMatch = afterSignature.match(/<\/[^>]+>/);
          if (closingTagMatch) {
            const insertPos =
              index +
              signatureText.length +
              closingTagMatch.index +
              closingTagMatch[0].length;
            template =
              template.slice(0, insertPos) +
              emptyLines +
              template.slice(insertPos);
            updated = true;
          }
        }
      }

      return { template, updated };
    };

    // Update EMBRYOLOGIST SIGNATURE
    const embryologistVariations = [
      "EMBRYOLOGIST SIGNATURE",
      "Embryologist Signature",
      "EMBRYOLOGIST SIGNATURE:",
      "Embryologist Signature:"
    ];
    let embryologistUpdated = false;
    for (const variation of embryologistVariations) {
      if (template.includes(variation)) {
        const result = addEmptyLinesAfterSignature(template, variation);
        template = result.template;
        if (result.updated) {
          embryologistUpdated = true;
          console.log(`Added empty lines after ${variation}`);
          break;
        }
      }
    }

    // Update DOCTOR SIGNATURE
    const doctorVariations = [
      "DOCTOR SIGNATURE",
      "Doctor Signature",
      "DOCTOR SIGNATURE:",
      "Doctor Signature:"
    ];
    let doctorUpdated = false;
    for (const variation of doctorVariations) {
      if (template.includes(variation)) {
        const result = addEmptyLinesAfterSignature(template, variation);
        template = result.template;
        if (result.updated) {
          doctorUpdated = true;
          console.log(`Added empty lines after ${variation}`);
          break;
        }
      }
    }

    if (!embryologistUpdated && !doctorUpdated) {
      console.warn(
        "Warning: Could not find signature sections in the expected format."
      );
      console.log(
        "Template may need manual update. Please check the template structure."
      );
    }

    // Update the template in the database
    await connection.query(
      `UPDATE embryology_formats SET embryologyTemplate = :template WHERE id = :id`,
      {
        type: Sequelize.QueryTypes.UPDATE,
        replacements: {
          template: template,
          id: templateResult.id
        }
      }
    );

    console.log("Template updated successfully!");
    console.log(`Updated template ID: ${templateResult.id}`);
    console.log(
      "The Semen Analysis report template now has 5 empty lines below the signature sections."
    );

    // Close database connection
    if (MySqlConnection._instance) {
      await MySqlConnection._instance.close();
    }

    process.exit(0);
  } catch (error) {
    console.error("Error updating template:", error);
    console.error(error.stack);

    // Close database connection on error
    if (MySqlConnection._instance) {
      await MySqlConnection._instance.close();
    }

    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  updateSemenAnalysisTemplate();
}

module.exports = updateSemenAnalysisTemplate;
