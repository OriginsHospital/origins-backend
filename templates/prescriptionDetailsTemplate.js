const prescriptionDetailsTemplate = `
 <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Prescription</title>
</head>

<body style="width: 210mm; height: 297mm; margin: 0 auto; padding: 5mm; box-sizing: border-box; font-family: Arial, sans-serif; font-size: 14px;">
    {{{hospitalLogoInformation}}}
    <hr style="border: 0; height: 1px; background: #ddd; margin: 10px 0;">
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; overflow: hidden; font-size: 12px;">
        <tr>
            <td style="width: 50%; padding: 6px; border: 1px solid black;"><strong style="color: black;">Patient Name:</strong> {{patientName}} </td>
            <td style="width: 50%; padding: 6px; border: 1px solid black;"><strong style="color: black;">Date:</strong> {{currentDate}} </td>
        </tr>
        <tr>
            <td style="width: 50%; padding: 6px; border: 1px solid black;"><strong style="color: black;">Age:</strong> {{patientAge}} </td>
            <td style="width: 50%; padding: 6px; border: 1px solid black;"><strong style="color: black;">Gender:</strong> {{gender}} </td>
        </tr>
        <tr>
            <td colspan="2" style="padding: 6px; border: 1px solid black;"><strong style="color: black;">Appointment Reason:</strong> {{appointmentReason}}</td>
        </tr>
    </table>
    <hr style="border: 0; height: 1px; background: #ddd; margin: 10px 0;">
    
    <h3 style="font-size: 20px; color: black; text-align: center; margin: 10px 0;">Prescription Details</h3>
    
    <hr style="border: 0; height: 1px; background: #ddd; margin: 10px 0;">
    
    <div style="width: 100%; margin-top: 10px;">
        {{#if showNotes}}
            <h4 style="font-size: 17px; color: black; text-align: center; margin: 10px 0;">Consultation Notes</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; overflow: hidden; font-size: 12px;">
                <tr>
                    <th style="border: 1px solid black; padding: 6px; text-align: left; font-weight: bold;">Consultation Notes</th>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 6px; text-align: left; word-wrap: break-word; white-space: normal; max-width: 200px;">{{{notesDetails}}}</td>
                </tr>
            </table>
            <hr style="border: 0; height: 1px; background: #ddd; margin: 10px 0;">
        {{/if}}
        
        {{#if showPharmacy}}
            <h3 style="font-size: 17px; color: black; text-align: center; margin: 10px 0;">Pharmacy</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; overflow: hidden; font-size: 12px;">
                <tr>
                    <th style="border: 1px solid black; padding: 6px; text-align: left; font-weight: bold;">Name</th>
                    <th style="border: 1px solid black; padding: 6px; text-align: left; font-weight: bold;">Dosage</th>
                    <th style="border: 1px solid black; padding: 6px; text-align: left; font-weight: bold;">Prescribed Quantity</th>
                </tr>
                {{#each pharmacyDetails}}
                <tr>
                    <td style="border: 1px solid black; padding: 6px; text-align: left; word-wrap: break-word; white-space: normal; max-width: 200px;">{{this.name}}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: left; word-wrap: break-word; white-space: normal; max-width: 200px;">{{this.dosage}}</td>
                    <td style="border: 1px solid black; padding: 6px; text-align: left; word-wrap: break-word; white-space: normal; max-width: 200px;">{{this.prescribedQuantity}}</td>
                </tr>
                {{/each}}
            </table>
            <hr style="border: 0; height: 1px; background: #ddd; margin: 10px 0;">
        {{/if}}
        
        {{#if showLabs}}
            <h3 style="font-size: 17px; color: black; text-align: center; margin: 10px 0;">Labs</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; overflow: hidden; font-size: 12px;">
                <tr>
                    <th style="border: 1px solid black; padding: 6px; text-align: left; font-weight: bold;">Name</th>
                </tr>
                {{#each labDetails}}
                <tr>
                    <td style="border: 1px solid black; padding: 6px; text-align: left; word-wrap: break-word; white-space: normal; max-width: 200px;">{{this.name}}</td>
                </tr>
                {{/each}}
            </table>
            <hr style="border: 0; height: 1px; background: #ddd; margin: 10px 0;">
        {{/if}}
        
        {{#if showScans}}
            <h3 style="font-size: 17px; color: black; text-align: center; margin: 10px 0;">Scans</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; overflow: hidden; font-size: 12px;">
                <tr>
                    <th style="border: 1px solid black; padding: 6px; text-align: left; font-weight: bold;">Name</th>
                </tr>
                {{#each scanDetails}}
                <tr>
                    <td style="border: 1px solid black; padding: 6px; text-align: left; word-wrap: break-word; white-space: normal; max-width: 200px;">{{this.name}}</td>
                </tr>
                {{/each}}
            </table>
            <hr style="border: 0; height: 1px; background: #ddd; margin: 10px 0;">
        {{/if}}
        
        {{#if showEmbryology}}
            <h3 style="font-size: 17px; color: black; text-align: center; margin: 10px 0;">Embryology</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; overflow: hidden; font-size: 12px;">
                <tr>
                    <th style="border: 1px solid black; padding: 6px; text-align: left; font-weight: bold;">Name</th>
                </tr>
                {{#each embryologyDetails}}
                <tr>
                    <td style="border: 1px solid black; padding: 6px; text-align: left; word-wrap: break-word; white-space: normal; max-width: 200px;">{{this.name}}</td>
                </tr>
                {{/each}}
            </table>
            <hr style="border: 0; height: 1px; background: #ddd; margin: 10px 0;">
        {{/if}}
    </div>
    
    <div style="text-align: right; margin: 10px; font-weight: bold; font-size: 14px;">
        <strong>Doctor's Signature:</strong> {{doctorName}}
    </div>
</body>
</html>
`;

module.exports = prescriptionDetailsTemplate;
