let opdSheetTemplate = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>OPD Case Sheet</title>
</head>
<body style="width: 210mm; height: 297mm; margin: 0 auto; padding: 3mm; box-sizing: border-box; font-family: Arial, sans-serif;">
    {hospitalLogoInformation}
    <div style="font-size:14px">
        <div style="background-color: #000; color: white; padding: 5px 10px; margin-bottom: 10px; text-align: center;">
            <h2 style="margin: 0;">OPD CASE SHEET</h2>
        </div>

        <div style="background-color: #000; text-align: center; color: white; padding: 5px 10px; margin-bottom: 10px;">
            <h3 style="margin: 0;">FEMALE PARTNER HISTORY</h3>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr>
                <td style="padding: 8px; width: 150px; border: 1px solid #000;">Date</td>
                <td style="padding: 8px; border: 1px solid #000;">{date}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #000;">Patient Name</td>
                <td style="padding: 8px; border: 1px solid #000;">{patientName}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #000;">Age</td>
                <td style="padding: 8px; border: 1px solid #000;">{age}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #000;">Height, Weight, BMI</td>
                <td style="padding: 8px; border: 1px solid #000;">{height} {weight} {bmi}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #000;">Marital status</td>
                <td style="padding: 8px; border: 1px solid #000;">{maritalStatus}</td>
            </tr>
        </table>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr>
                <td style="padding: 8px; width: 150px; border: 1px solid #000;">Infertility</td>
                <td style="padding: 8px; border: 1px solid #000;"></td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #000; height: 60px;">Menstrual H/O</td>
                <td style="padding: 8px; border: 1px solid #000;"></td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #000; height: 60px;">OBS H/O </td>
                <td style="padding: 8px; border: 1px solid #000;"></td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #000; height: 60px;">Medical H/O</td>
                <td style="padding: 8px; border: 1px solid #000;"></td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #000; height: 60px;">Surgical H/O</td>
                <td style="padding: 8px; border: 1px solid #000;"></td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #000; height: 60px;">Treatment History </td>
                <td style="padding: 8px; border: 1px solid #000;"></td>
            </tr>
        </table>
        

        <div style="background-color: #000; color: white; padding: 5px 10px; margin-bottom: 10px;text-align: center;">
            <h3 style="margin: 0;">MALE PARTNER HISTORY</h3>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr>
                <td style="padding: 8px; width: 150px; border: 1px solid #000;">Coitus</td>
                <td style="padding: 8px; border: 1px solid #000;"></td>
            </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr>
                <td style="padding: 8px; width: 150px; border: 1px solid #000;">Name</td>
                <td style="padding: 8px; border: 1px solid #000;">{spouseName}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #000;">Age, Occupation</td>
                <td style="padding: 8px; border: 1px solid #000;"></td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #000;">Height, Weight, BMI</td>
                <td style="padding: 8px; border: 1px solid #000;">{spouseBmiInformation}</td>
            </tr>
        </table>
        
        <div style='page-break-after: always;'></div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
             
            <tr>
                <td style="padding: 8px; width: 150px; border: 1px solid #000; height: 60px;">Medical H/O </td>
                <td style="padding: 8px; border: 1px solid #000;"></td>
            </tr>
            <tr>
                <td style="padding: 8px; width: 120px; border: 1px solid #000; height: 60px;">Surgical H/O</td>
                <td style="padding: 8px; border: 1px solid #000;"></td>
            </tr>
            <tr>
                <td style="padding: 8px; width: 120px; border: 1px solid #000; height: 60px;">Treatment H/O</td>
                <td style="padding: 8px; border: 1px solid #000;"></td>
            </tr>
             <tr>
                <td style="padding: 8px; width: 120px; border: 1px solid #000;">Addictions </td>
                <td style="padding: 8px; border: 1px solid #000;"></td>
            </tr>
        </table>
        
        <div style="background-color: #000; color: white; padding: 5px 10px; margin-bottom: 10px;">
            <h3 style="margin: 0;">SUMMARY</h3>
        </div>

        <div style="border: 1px solid #000; padding: 10px; min-height: 100px;">
        </div>
    </div>
</body>
</html>
`;

module.exports = opdSheetTemplate;
