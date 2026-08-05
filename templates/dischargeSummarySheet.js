const dischargeSummarySheet = `
    <html>
    <head>
        <title>IVF-ICSI Discharge Summary</title>
    </head>
    <body>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid black;">
    <tr>
        <td colspan="4" style="text-align: center; border: 1px solid black; padding: 8px; font-weight: bold; font-size: 16px; background-color: #ffffff; color: #000000;">IVF-ICSI DISCHARGE SUMMARY</td>
    </tr>
    <tr>
        <td style="border: 1px solid black; padding: 5px; width: 25%; font-weight: bold; background-color: #ffffff; color: #000000;">PATIENT NAME</td>
        <td style="border: 1px solid black; padding: 5px; width: 25%; background-color: #ffffff; color: #000000;">{{patientName}}</td>
        <td style="border: 1px solid black; padding: 5px; width: 25%; font-weight: bold; background-color: #ffffff; color: #000000;">AGE</td>
        <td style="border: 1px solid black; padding: 5px; width: 25%; background-color: #ffffff; color: #000000;">{{patientAge}}</td>
    </tr>
    <tr>
        <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">HUSBAND NAME</td>
        <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;">{{husbandName}}</td>
        <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">AGE</td>
        <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;">{{husbandAge}}</td>
    </tr>
    <tr>
        <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">DOCTOR NAME</td>
        <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;">{{doctorName}}</td>
        <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">EMBRYOLOGIST NAME</td>
        <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;">{{embryologistName}}</td>
    </tr>
    <tr>
        <td colspan="4" style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">PLAN OF CYCLE </td>
    </tr>
    <tr>
        <td colspan="4" style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;">{{planOfCycle}}</td>
    </tr>
    <tr>
        <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">TOTAL NO OF OOCYTES</td>
        <td colspan="3" style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;"></td>
    </tr>
    <tr>
        <td colspan="4">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 20%; border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">PLAN</td>
                    <td style="width: 80%; border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">OTHERS</td>
                    <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">MII</td>
                    <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">MI</td>
                    <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">GV</td>
                    <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">CLEVAGE (DAY 3)</td>
                    <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">BLASTOCYST</td>
                    <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;"></td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td colspan="4">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 33%; border: 1px solid black; padding: 5px; font-weight: bold; text-align: center; background-color: #ffffff; color: #000000;">SPERM DETAILS</td>
                    <td style="width: 33%; border: 1px solid black; padding: 5px; font-weight: bold; text-align: center; background-color: #ffffff; color: #000000;">PRE WASH</td>
                    <td style="width: 33%; border: 1px solid black; padding: 5px; font-weight: bold; text-align: center; background-color: #ffffff; color: #000000;">POST WASH</td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">COUNT</td>
                    <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;"></td>
                    <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">MOTILITY</td>
                    <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;"></td>
                    <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #ffffff; color: #000000;">MORPHOLOGY</td>
                    <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;"></td>
                    <td style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;"></td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td colspan="4" style="border: 1px solid black; padding: 5px; text-align: center; font-weight: bold; background-color: #ffffff; color: #000000;">EMBRYO TRANSFER</td>
    </tr>
     <tr>
        <td colspan="4">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; font-weight: bold; text-align: center; background-color: #ffffff; color: #000000;">DATE OF TRANSFER</td>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; font-weight: bold; text-align: center; background-color: #ffffff; color: #000000;">DAY OF TRANSFER</td>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; font-weight: bold; text-align: center; background-color: #ffffff; color: #000000;">NUMBER OF EMBRYOS TRANSFERRED</td>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; font-weight: bold; text-align: center; background-color: #ffffff; color: #000000;">GRADES</td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 10px; background-color: #ffffff; color: #000000;"></td>
                    <td style="border: 1px solid black; padding: 10px; background-color: #ffffff; color: #000000;"></td>
                    <td style="border: 1px solid black; padding: 10px; background-color: #ffffff; color: #000000;"></td>
                    <td style="border: 1px solid black; padding: 10px; background-color: #ffffff; color: #000000;"></td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td colspan="4" style="border: 1px solid black; padding: 5px; text-align: center; font-weight: bold; background-color: #ffffff; color: #000000;">CRYOPRESERVATION</td>
    </tr>
     <tr>
        <td colspan="4">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; font-weight: bold; text-align: center; background-color: #ffffff; color: #000000;">TOTAL EMBRYOS FROZEN</td>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; font-weight: bold; text-align: center; background-color: #ffffff; color: #000000;">DATE OF FREEZING</td>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; font-weight: bold; text-align: center; background-color: #ffffff; color: #000000;">DAY OF FREEZING</td>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; font-weight: bold; text-align: center; background-color: #ffffff; color: #000000;">STAGES & GRADE OF EMBRYOS</td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 10px; background-color: #ffffff; color: #000000;"></td>
                    <td style="border: 1px solid black; padding: 10px; background-color: #ffffff; color: #000000;"></td>
                    <td style="border: 1px solid black; padding: 10px; background-color: #ffffff; color: #000000;"></td>
                    <td style="border: 1px solid black; padding: 10px; background-color: #ffffff; color: #000000;"></td>
                </tr>
            </table>
        </td>
    </tr>
    
    <tr>
        <td colspan="4" style="border: 1px solid black; padding: 5px; font-size:12px; background-color: #ffffff; color: #000000;">
            <div>COMMENTS: A) OOCYTE QUALITIES - (AVERAGE / PRESENT OF DYSMORPHIC BODIES, MODERATE GRANULAR CYTOPLASM, CENTRALLY PITTED OOCYTES, FRAGMENTED POLAR BODIES)</div>
            <p>{{comments}}</p>
        </td>
    </tr>
    <tr>
        <td colspan="2" style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;">
            <div style="font-weight: bold;">EMBRYOLOGIST NAME</div>
            <div>{{embryologistName}}</div>
        </td>
        <td colspan="2" style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;">
            <div style="font-weight: bold;">DOCTOR NAME</div>
            <div>{{doctorName}}</div>
        </td>
    </tr>
    <tr>
        <td colspan="2" style="border: 1px solid black; padding: 5px; height: 50px; background-color: #ffffff; color: #000000;">EMBRYOLOGIST SIGNATURE</td>
        <td colspan="2" style="border: 1px solid black; padding: 5px; background-color: #ffffff; color: #000000;">DOCTOR SIGNATURE</td>
    </tr>
</table>
</body>
</html>
`;

module.exports = dischargeSummarySheet;
