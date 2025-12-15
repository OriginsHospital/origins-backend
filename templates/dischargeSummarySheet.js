const dischargeSummarySheet = `
    <html>
    <head>
        <title>Freezing Report</title>
    </head>
    <body>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid black;">
    <tr>
        <td colspan="4" style="text-align: center; border: 1px solid black; padding: 5px; font-weight: bold; background-color: #4a90e2; color: white;">IVF-ICSI DISCHARGE SUMMARY</td>
    </tr>
    <tr>
        <td style="border: 1px solid black; padding: 5px; width: 25%; ">PATIENT NAME</td>
        <td style="border: 1px solid black; padding: 5px; width: 25%;">{{patientName}}</td>
        <td style="border: 1px solid black; padding: 5px; width: 25%; ">AGE</td>
        <td style="border: 1px solid black; padding: 5px; width: 25%;">{{patientAge}}</td>
    </tr>
    <tr>
        <td style="border: 1px solid black; padding: 5px; ">HUSBAND NAME</td>
        <td style="border: 1px solid black; padding: 5px;">{{husbandName}}</td>
        <td style="border: 1px solid black; padding: 5px; ">AGE</td>
        <td style="border: 1px solid black; padding: 5px;">{{husbandAge}}</td>
    </tr>
    <tr>
        <td style="border: 1px solid black; padding: 5px; ">DOCTOR NAME</td>
        <td style="border: 1px solid black; padding: 5px;"></td>
        <td style="border: 1px solid black; padding: 5px; ">EMBRYOLOGIST NAME</td>
        <td style="border: 1px solid black; padding: 5px;"></td>
    </tr>
    <tr>
        <td colspan="4" style="border: 1px solid black; padding: 5px; ">PLAN OF CYCLE </td>
    </tr>
    <tr>
        <td style="border: 1px solid black; padding: 5px; ">TOTAL NO OF OOCYTES</td>
        <td colspan="3" style="border: 1px solid black; padding: 5px;"></td>
    </tr>
    <tr>
        <td colspan="4">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 20%; border: 1px solid black; padding: 5px; ">PLAN</td>
                    <td style="width: 80%; border: 1px solid black; padding: 5px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; ">OTHERS</td>
                    <td style="border: 1px solid black; padding: 5px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; ">MII</td>
                    <td style="border: 1px solid black; padding: 5px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; ">MI</td>
                    <td style="border: 1px solid black; padding: 5px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; ">GV</td>
                    <td style="border: 1px solid black; padding: 5px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; ">CLEVAGE (DAY 3)</td>
                    <td style="border: 1px solid black; padding: 5px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; ">BLASTOCYST</td>
                    <td style="border: 1px solid black; padding: 5px;"></td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td colspan="4">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 33%; border: 1px solid black; padding: 5px; background-color: #4a90e2; color: white;">SPERM DETAILS</td>
                    <td style="width: 33%; border: 1px solid black; padding: 5px; text-align: center; background-color: #4a90e2; color: white;">PRE WASH</td>
                    <td style="width: 33%; border: 1px solid black; padding: 5px; text-align: center; background-color: #4a90e2; color: white;">POST WASH</td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; ">COUNT</td>
                    <td style="border: 1px solid black; padding: 5px;"></td>
                    <td style="border: 1px solid black; padding: 5px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; ">MOTILITY</td>
                    <td style="border: 1px solid black; padding: 5px;"></td>
                    <td style="border: 1px solid black; padding: 5px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 5px; ">MORPHOLOGY</td>
                    <td style="border: 1px solid black; padding: 5px;"></td>
                    <td style="border: 1px solid black; padding: 5px;"></td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td colspan="4" style="border: 1px solid black; padding: 5px; text-align: center; font-weight: bold; background-color: #4a90e2; color: white;">EMBRYO TRANSFER</td>
    </tr>
     <tr>
        <td colspan="4">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; background-color: #4a90e2; color: white;">DATE OF TRANSFER</td>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; text-align: center; background-color: #4a90e2; color: white;">DAY OF TRANSFER</td>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; text-align: center; background-color: #4a90e2; color: white;">NUMBER OF EMBRYOS TRANSFERRED</td>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; text-align: center; background-color: #4a90e2; color: white;">GRADES</td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 10px;"></td>
                    <td style="border: 1px solid black; padding: 10px;"></td>
                    <td style="border: 1px solid black; padding: 10px;"></td>
                    <td style="border: 1px solid black; padding: 10px;"></td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td colspan="4" style="border: 1px solid black; padding: 5px; text-align: center; font-weight: bold; background-color: #4a90e2; color: white;">CRYOPRESERVATION</td>
    </tr>
     <tr>
        <td colspan="4">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; background-color: #4a90e2; color: white;">TOTAL EMBRYOS FROZEN</td>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; text-align: center; background-color: #4a90e2; color: white;">DATE OF FREEZING</td>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; text-align: center; background-color: #4a90e2; color: white;">DAY OF FREEZING</td>
                    <td style="width: 25%; border: 1px solid black; padding: 5px; text-align: center; background-color: #4a90e2; color: white;">STAGES & GRADE OF EMBRYOS</td>
                </tr>
                <tr>
                    <td style="border: 1px solid black; padding: 10px;"></td>
                    <td style="border: 1px solid black; padding: 10px;"></td>
                    <td style="border: 1px solid black; padding: 10px;"></td>
                    <td style="border: 1px solid black; padding: 10px;"></td>
                </tr>
            </table>
        </td>
    </tr>
    
    <tr>
        <td colspan="4" style="border: 1px solid black; padding: 5px;font-size:10px ">
            <div>COMMENTS: A) OOCYTE QUALITIES - (AVERAGE / PRESENT OF DYSMORPHIC BODIES, MODERATE GRANULAR CYTOPLASM, CENTRALLY PITTED OOCYTES, FRAGMENTED POLAR BODIES)</div>
            <p></p>
        </td>
    </tr>
    <tr>
        <td colspan="2" style="border: 1px solid black; padding: 5px; ">
            <div>EMBRYOLOGIST NAME</div>
            <div></div>
        </td>
        <td colspan="2" style="border: 1px solid black; padding: 5px; ">
            <div>DOCTOR NAME</div>
            <div></div>
        </td>
    </tr>
    <tr>
        <td colspan="2" style="border: 1px solid black; padding: 5px; height: 50px; ">EMBRYOLOGIST SIGNATURE</td>
        <td colspan="2" style="border: 1px solid black; padding: 5px; ">DOCTOR SIGNATURE</td>
    </tr>
</table>
</body>
</html>
`

module.exports = dischargeSummarySheet;