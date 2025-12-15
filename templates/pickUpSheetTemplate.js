const pickUpSheetTemplate = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EGG COLLECTION OPERATION SHEET</title>
</head>
<body style="margin: 0; padding: 20px; width: 210mm; height: 297mm; font-family: Arial, sans-serif; font-size: 12px; box-sizing: border-box;">
    <div style="width: 100%; max-width: 190mm; margin: 0 auto;">
        <h1 style="text-align: center; margin-bottom: 20px; font-size: 16px; text-decoration: underline;">EGG COLLECTION OPERATION SHEET</h1>
        
        <div style="margin-bottom: 10px;">
            <div style="display: inline-block; width: 45%;">
                <div style="margin-bottom: 8px;">NAME: {{patientName}}</div>
                <div style="margin-bottom: 8px;">AGE: {{patientAge}}</div>
                <div style="margin-bottom: 8px;">DATE: ___________________________</div>
                <div style="margin-bottom: 8px;">TREATMENT: IVF/ICSI</div>
                <div style="margin-bottom: 8px;">ENDOMETRIAL THICKNESS: __________</div>
            </div>
            <div style="display: inline-block; width: 45%; vertical-align: top;">
                <div style="margin-bottom: 8px;">REG NO: _________________________</div>
                <div style="margin-bottom: 8px;">TIME: ___________________________</div>
                <div style="margin-bottom: 20px;"></div>
                <div style="margin-bottom: 8px;">ANTIBIOTIC: ____________________</div>
            </div>
        </div>

        <div style="margin-bottom: 10px;">
            <div>PROCEDURE DONE: VAGINALLY / LAPAROSCOPICALLY</div>
            <div>FOLLICULAR FLUSHING DONE: YES/NO &nbsp;&nbsp;&nbsp; WITH: MEDIA / HEPARIN+NORMAL SALINE</div>
        </div>

        <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
            <div style="width: 45%;">
                <div>NUMBER OF FOLLICLES RIGHT</div>
                <div style="border: 1px solid black; width: 40px; height: 25px; margin: 5px 0;"></div>
                <div>NUMBER OF EGGS –RIGHT</div>
                <div style="border: 1px solid black; width: 40px; height: 25px; margin: 5px 0;"></div>
            </div>
            <div style="width: 45%;">
                <div>NUMBER OF FOLLICLES LEFT</div>
                <div style="border: 1px solid black; width: 40px; height: 25px; margin: 5px 0;"></div>
                <div>NUMBER OF EGGS – LEFT</div>
                <div style="border: 1px solid black; width: 40px; height: 25px; margin: 5px 0;"></div>
            </div>
        </div>

        <div style="margin-bottom: 10px;">
            <div>FOLLICLE ASPIRATION: EASY / DIFFICULT</div>
            <div>MOCK TRANSFER: EASY / DIFFICULT</div>
            <div>UCL: _____ FLUID IN THE CAVITY: YES / NO</div>
            <div>CERVICAL DILATATION DONE: YES / NO</div>
            <div>E.S. / HCG FLUSH: _____________________</div>
        </div>

        <div style="margin-bottom: 10px;">
            <div>ADDITIONAL COMMENTS: _________________________________________________</div>
        </div>

        <h2 style="text-align: center; margin: 20px 0; font-size: 14px; text-decoration: underline;">INSTRUCTIONS AFTER THE EGG COLLECTION</h2>

        <div style="margin-bottom: 20px;">
            <ul style="list-style-type: disc; padding-left: 20px; margin-bottom: 15px;">
                <li style="margin-bottom: 8px;">SOFT DIET TODAY</li>
                <li style="margin-bottom: 8px;">NORMAL DIET FROM TOMORROW</li>
                <li style="margin-bottom: 8px;">AFTER THE PROCEDURE ,REST FOR A DAY</li>
                <li style="margin-bottom: 8px;">RESUME NORMAL ACTIVITY WHEN YOU FEEL WELL ENOUGH</li>
                <li style="margin-bottom: 8px;">A SLIGHT DEGREE OF PAIN, DISCOMFORT AND ABDOMINAL BLOATING ARE COMMON FOLLOWING EGG COLLECTION. IF THESE SYMPTOMS APPEAR TO BE INCREASING AND YOU ARE FEELING UNWELL PLEASE CONTACT THE CLINIC. (PH NO:8790486090)</li>
                <li style="margin-bottom: 8px;">SMALL AMOUNT OF VAGINAL SPOTTING IS COMMON IMMEDIATELY FOLLOWING AN EGG COLLECTION. THIS SHOULD SUBSIDE WITHIN 48HOURS.</li>
                <li style="margin-bottom: 8px;">YOUR EMBRYO TRANSFER WILL BE 2-5DAYS AFTER THE EGG PICK UP. YOU WILL BE INFORMED ACCORDINGLY ONE DAY PRIOR TO THE TRANSFER</li>
            </ul>
        </div>
        
        <!-- Page break to ensure proper printing -->
        <div style="page-break-before: always;"></div>

        <div style="margin-bottom: 10px;">
            <div style="font-weight: bold;">MEDICATIONS TO BE TAKEN :</div>
            <ol style="margin-top: 5px; padding-left: 20px;">
                <li>TAB.PARACETAMOL 650MG BD FROM ........... TILL........</li>
                <li>TAB. BIFOLATE ONCE DAILY</li>
                <li>TAB.OVAFETAL ONCE DAILY</li>
                <li>TAB THYRONORM ............MCG TO BE CONTINUED AS PRESCRIBED</li>
                <li>TAB. METFORMIN TWICE/ THRICE DAILY</li>
                <li>TAB PROGYNOVA 2 MG ONE / TWO TABS THREE TIMES A DAY</li>
                <li>TAB. STRIPTYTOUT 650MG TID FROM .......... TILL..........</li>
                <li>TAB.MYTHEND D/N TWICE DAILY</li>
                <li>TAB.LETHOZ 5MG FROM ......... ... ..TILL........</li>
                <li>TAB.POST REG N 10 MG BD FROM........ ...... TILL........</li>
                <li>TAB.DOM 100MG BD FROM ....... ..... TILL......</li>
                <li>TAB.PAN 40MG OD FROM ......... TILL......</li>
                <li>INJ. SETROSIL 0.25 MG ONCE .....................</li>
                <li>HASS ON ..............</li>
                <li>DAY 3 DISCUSSION ON..........</li>
            </ol>
        </div>
    </div>

</body>
</html>
`

module.exports = pickUpSheetTemplate