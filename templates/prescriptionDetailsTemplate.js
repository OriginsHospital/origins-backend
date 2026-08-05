const prescriptionDetailsTemplate = `
 <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Prescription</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            width: 210mm;
            margin: 0 auto;
            padding: 8mm;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 16px;
            line-height: 1.45;
            color: #000;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .patient-info-table,
        .section-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 15px;
        }
        .patient-info-table td,
        .section-table th,
        .section-table td {
            border: 1px solid #000;
            padding: 8px 10px;
            text-align: left;
            word-wrap: break-word;
            white-space: normal;
            vertical-align: top;
        }
        .patient-info-table td {
            font-weight: 600;
            font-size: 15px;
        }
        .patient-info-table .label {
            font-weight: 700;
            color: #000;
        }
        .section-table th {
            font-weight: 700;
            font-size: 15px;
            background: #f3f3f3;
        }
        .section-table td {
            font-size: 15px;
            font-weight: 600;
        }
        .section-title {
            font-size: 20px;
            font-weight: 700;
            color: #000;
            text-align: center;
            margin: 14px 0 10px;
        }
        .main-title {
            font-size: 22px;
            font-weight: 700;
            color: #000;
            text-align: center;
            margin: 12px 0;
        }
        .prescribed-by {
            font-size: 15px;
            font-weight: 700;
            color: #000;
            text-align: right;
            margin: 6px 0 8px;
        }
        .divider {
            border: 0;
            height: 1px;
            background: #bbb;
            margin: 12px 0;
        }
        .notes-content,
        .notes-content * {
            font-size: 15px !important;
            line-height: 1.5 !important;
            color: #000 !important;
            font-weight: 600 !important;
        }
        .doctor-signature {
            text-align: right;
            margin: 16px 10px 8px;
            font-weight: 700;
            font-size: 16px;
        }
        @media print {
            body {
                width: auto;
                padding: 6mm;
                font-size: 12pt;
            }
            .patient-info-table,
            .section-table {
                font-size: 11pt;
            }
            .patient-info-table td,
            .section-table th,
            .section-table td {
                font-size: 11pt;
                padding: 7px 9px;
            }
            .main-title {
                font-size: 16pt;
            }
            .section-title {
                font-size: 14pt;
            }
            .prescribed-by,
            .doctor-signature {
                font-size: 12pt;
            }
            .notes-content,
            .notes-content * {
                font-size: 11pt !important;
            }
        }
    </style>
</head>

<body>
    {{{hospitalLogoInformation}}}
    <hr class="divider">

    <table class="patient-info-table">
        <tr>
            <td style="width: 50%;"><span class="label">Patient Name:</span> {{patientName}}</td>
            <td style="width: 50%;"><span class="label">Date:</span> {{currentDate}}</td>
        </tr>
        <tr>
            <td style="width: 50%;"><span class="label">Age:</span> {{patientAge}}</td>
            <td style="width: 50%;"><span class="label">Gender:</span> {{gender}}</td>
        </tr>
        <tr>
            <td colspan="2"><span class="label">Appointment Reason:</span> {{appointmentReason}}</td>
        </tr>
    </table>
    <hr class="divider">

    <h4 class="section-title">Vital Details</h4>
    <table class="patient-info-table">
        <tr>
            <td style="width: 50%;"><span class="label">LMP:</span> {{lmp}}</td>
            <td style="width: 50%;"><span class="label">EDD:</span> {{edd}}</td>
        </tr>
        <tr>
            <td style="width: 50%;"><span class="label">Weight:</span> {{weight}}</td>
            <td style="width: 50%;"><span class="label">BP:</span> {{bp}}</td>
        </tr>
    </table>
    <hr class="divider">

    <h3 class="main-title">Prescription Details</h3>

    <hr class="divider">

    <div style="width: 100%; margin-top: 10px;">
        {{#if showNotes}}
            <h4 class="section-title">Consultation Notes</h4>
            <table class="section-table">
                <tr>
                    <th>Consultation Notes</th>
                </tr>
                <tr>
                    <td class="notes-content">{{{notesDetails}}}</td>
                </tr>
            </table>
            <hr class="divider">
        {{/if}}

        {{#if showPharmacy}}
            <h3 class="section-title">Pharmacy</h3>
            <p class="prescribed-by">
                Prescribed By: {{doctorName}}
            </p>
            <table class="section-table">
                <tr>
                    <th>Name</th>
                    <th>Dosage</th>
                    <th>Prescribed Quantity</th>
                    <th>Bought Quantity</th>
                </tr>
                {{#each pharmacyDetails}}
                <tr>
                    <td>{{this.name}}</td>
                    <td>{{this.dosage}}</td>
                    <td>{{this.prescribedQuantity}}</td>
                    <td>{{this.purchaseQuantity}}</td>
                </tr>
                {{/each}}
            </table>
            <hr class="divider">
        {{/if}}

        {{#if showLabs}}
            <h3 class="section-title">Labs</h3>
            <table class="section-table">
                <tr>
                    <th>Name</th>
                </tr>
                {{#each labDetails}}
                <tr>
                    <td>{{this.name}}</td>
                </tr>
                {{/each}}
            </table>
            <hr class="divider">
        {{/if}}

        {{#if showScans}}
            <h3 class="section-title">Scans</h3>
            <table class="section-table">
                <tr>
                    <th>Name</th>
                </tr>
                {{#each scanDetails}}
                <tr>
                    <td>{{this.name}}</td>
                </tr>
                {{/each}}
            </table>
            <hr class="divider">
        {{/if}}

        {{#if showEmbryology}}
            <h3 class="section-title">Embryology</h3>
            <table class="section-table">
                <tr>
                    <th>Name</th>
                </tr>
                {{#each embryologyDetails}}
                <tr>
                    <td>{{this.name}}</td>
                </tr>
                {{/each}}
            </table>
            <hr class="divider">
        {{/if}}
    </div>

    <div class="doctor-signature">
        Doctor's Signature: {{doctorName}}
    </div>
</body>
</html>
`;

module.exports = prescriptionDetailsTemplate;
