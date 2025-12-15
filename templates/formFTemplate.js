const formFTemplate = `
<body style="font-size:12px;line-height: 1.1">
    <p style="text-align: center;"><strong>FORM F</strong></p>
<p style="text-align: center;">[(See Provision&nbsp;to section 4(3), rule 9(4) and rule 10(1A)]</p>
<p><strong>FORM FOR MAINTENANCE OF RECORD IN CASE OF PRE NATAL DIAGNOSTIC TEST / PROCEDURE BY GENETIC CLINIC / ULTRASOUND CLINIC /MAGING CENTRE</strong></p>
<p><strong>Section A : </strong><strong><em>To be filled in for all Diagnostic Procedures/Tests</em></strong></p>
<ol>
<li>Name and complete address of Genetic Clinic/Ultrasound Clinic/Imaging centre<br />{hospitalAddress}</li>
<li>Registration No. (Under PC &amp; PNDT Act, 1994) : {registrationNumber}</li>
<li>Patient&rsquo;s name : {patientName} <br> Age : {patientAge}</li>
<li>Total Number of living children : _____________ <br>Number of living Sons with age of each living son (in years or months) :
<br>Number of living Daughters with age of each living daughter (in years of months) :
</li>
</ol>
<ol start="5">
<li>Husband&rsquo;s/Wife&rsquo;s/Father&rsquo;s/Mother&rsquo;s Name : {guardianName}</li>
<li>Full postal address of the patient with Contact Number, if any {completeaddress}</li>
<li>(a) Referred by (Full name and address of Doctor(s)/Genetic Counseling Centre) : </li>
</ol>

<p><strong><em>(Referral slips to be preserved carefully with Form F)</em></strong></p>
<p>(b) Self-Referral by Gynaecologist/Radiologist/Registered Medical Practitioner conducting the diagnostic procedures : _____________________________</p>
<p><strong><em>(Referral note with indications and case papers of the patient to be preserved with Form F)</em></strong></p>
<p><strong><u>Self-referral does not mean a client coming to a clinical and requesting to the test or relative/s requesting for the test of a pregnant woman</u></strong></p>
<ol start="8">
<li>Last menstrual period or weeks of pregnancy : ___________________________________</li>
</ol>
<p style="text-align: center;"><strong>Section B : </strong><strong><em>To be filled in for performing non-invasive diagnostic Procedures/Tests only.</em></strong></p>
<ol start="9">
<li>Name of the doctor performing the procedure/s : _______________________</li>
<li>Indication/s for diagnosis procedure ____________________________________ <strong><em>(specify with reference to the request made in the referral slip or in a self-referral note)</em></strong></li>
</ol>
<p>(Ultrasonography prenatal diagnosis during pregnancy should only be performed when indicated. The following is the representative list of indications for ultrasound during pregnancy. <strong>(Put a &ldquo;Tick&rdquo; against the appropriate indication/s for ultrasound)</strong></p>
<p>
    1. To diagnose intra-uterine and/or ectopic pregnancy and confirm viability. 
    2. Estimation of gestational age (dating). 
    3. Detection of number of fetuses and their chorionicity. 
    4. Suspected pregnancy with IUCD in-situ or suspected pregnancy following contraceptive failure/MTP failure. 
    5. Vaginal bleeding/leaking. 
    6. Follow-up of cases of abortion. 
    7. Assessment of cervical canal and diameter of internal os. 
    8. Discrepancy between uterine size and period of amenorrhea. 
    9. Any suspected adenexal or uterine pathology/abnormality. 
    10. Detection of chromosomal abnormalities, fetal structural defects and other abnormalities and their follow-up. 
    11. To evaluate fetal presentation and position. 
    12. Assessment of liquor amnii. 
    13. Preterm labor/preterm premature rupture of membranes. 
    14. Evaluation of placental position, thickness, grading and abnormalities (placenta praevia, retro-placental haemorrhage, abnormal adherence, etc.). 
    15. Evaluation of umbilical cord – presentation, insertion, nuchal encirclement, number of vessels and presence of true knot. 
    16. Evaluation of previous Caesarean Section scars. 
    17. Evaluation of fetal growth parameters, fetal weight, and fetal well-being. 
    18. Color flow mapping and duplex Doppler studies. 
    19. Ultrasound guided procedures such as medical termination of pregnancy, external cephalic version, etc., and their follow-up. 
    20. Adjunct to diagnostic and therapeutic invasive interventions such as chorionic villus sampling (CVS), amniocentesis, fetal blood sampling, fetal skin biopsy, amnio-infusion, intrauterine infusion, placement of shunts, etc. 
    21. Observation of intra-partum events. 
    22. Medical/surgical conditions complicating pregnancy. 
    23. Research/scientific studies in recognized institutions.
</p>
<ol start="11">
<li>Procedures carried out (Non-Invasive) <strong>(Put a &ldquo;Tick&rdquo; on the appropriate procedure) 
    </strong>
<br>  Ultrasound ( Important Note :Ultrasound is not indicated/adivised/performed to determine sex of foetus except for diagnosis of sex-link diseases such as Duchene Muscular Dystrophy, Hemoplilia A B etc.)
<br>Any Other (Specify)
</li>
</ol>
<ol start="12">
<li>Date on which declaration of pregnant woman/person was obtained : _____________________</li>
<li>Date on which procedures carried out : ________________________</li>
<li>Result of the non-invasive procedure carried out <strong><em>(report in brief of the test including ultrasound carried out)</em></strong>____________________________________</li>
<li>The result of pre-natal diagnostic procedures was conveyed to _________on _______.</li>
<li>Any indication for MTP as per the abnormality detected in the diagnostic procedures/tests ____________________________________________________</li>
</ol>
<p>Date __________&nbsp; <br>Place _________ </p>

<p style="text-align: right;"><strong>Name, Signature and Registration Number with Seal of the Gynaecologist / Radiologist, Registered Medical Practitioner performing Diagnostic Procedure/s</strong></p>


<p style="text-align: center;"><strong>SECTION C : </strong><strong><em>To be filled for performing invasive Procedure/Tests only</em></strong></p>
<ol start="17">
<li>Name of the doctor/s performing the procedure/s : </li>
<li>History of genetic/medical disease in the family (specify) :</li>
</ol>
<p>Basis of diagnosis <em>(&ldquo;Tick&rdquo; on appropriate basis of diagnosis)</em>&nbsp;: (a) Clinical (b) Bio-chemical (c) Cytogenetic (d) Other (e.g. radiological, ultrasonography, etc. specify)</p>
<ol start="19">
<li>Indication/s for the diagnosis procedure <em><em>(&ldquo;Tick&rdquo; on appropriate indication/s)<br /></em></em>A. Previous child/children with :<br />(i) Chromosomal Disorders (ii) Metabolic disorders (iii) Congenital anomaly (iv) Mental Disability (v) Haemogiobinopathy (vi) Sex linked disorders (vii) Single gene disorder (viii) Any other (specify)

B. Advanced maternal age (35 years)<br />C. Mother/father/sibling has genetic disease (specify)<br />D. Other (specify) _____________________</li>
<li>Date on which consent of pregnant woman/person was obtained in Form G prescribed in PC &amp; PNDT Act, 1994 : _______________</li>
<li>
<p>Invasive procedures carried out <em>(&ldquo;Tick&rdquo; on appropriate indication/s)</em></p>
<p>(i) Amniocentesis (ii) Chorionic Villi aspiration (iii) Fetal biopsy (iv) Cordocentesis (v) Any other (specify)</p>
</li>
</ol>
<ol start="24">
<li>Result of the Procedures/Tests carried out (report in brief of the invasive tests/procedures carried out) _____________________</li>
</ol>
<ol start="25">
<li>Date on which procedures carried out : _________________</li>
<li>The result of pre-natal diagnostic procedures was conveyed to _________on _________.</li>
<li>Any indication for MTP&nbsp;as per the abnormality detected in the diagnostic procedures/tests: </li>
</ol>

<p>Date __________</p>
<p>Place _________&nbsp;</p>
<p style="text-align: right;"><strong>Name, Signature and Registration Number with Seal of the Gynaecologist / Radiologist, Registered Medical Practitioner performing Diagnostic Procedure/s</strong></p>

<p><strong>SECTION D : </strong><strong><em>Declaration</em></strong></p>
<p style="text-align: center;"><strong>DECLARATION OF THE PERSON UNDERGOING PRENATAL DIAGNOSTIC TEST/PROCEDURE</strong></p>

<p>I, {patientName} declare that by undergoing <strong>{scanName}</strong> Prenatal Diagnostic Test/Procedure. I do not want to know the sex of my foetus.</p>
<p><strong>Date :&nbsp;</strong></p>
<p style="text-align: right;"><strong>Signature/Thump impression of the person undergoing the Prenatal Diagnostic Test/Procedure</strong></p>

<p><strong>In case of thump Impression :</strong></p>
<p>Identified by (Name) __________Age : ________ Sex : ________</p>
<p>Relation (if any) : _______ Address &amp; Contact No : ___________________________</p>

<p><strong>Signature of a person attesting thump impression :</strong> ______________________</p>
<p><strong>Date :</strong> __________</p>

<p style="text-align: center;"><strong>DECLARATION OF DOCTOR/PERSON CONDUCTING PRE NATAL DIAGNOSTIC PROCEDURE/TEST</strong></p>

<p>I, _____________________(name of the person conducting ultrasonography/image scanninig) declare that while conducting ultrasonography/image scanning on Ms./Mr. _______________________ (name of the pregnant woman or the person undergoing pre natal diagnostic procedure / test), I have neither detected nor disclosed the sex of her fetus to anybody in any manner.</p>

<p><strong>Signature : _________________________</strong></p>
<p><strong>Date : </strong> <strong>______________________________________________________ </strong></p>
<p style="text-align: right;"><strong>Name in Capitals, Registration Number with Seal of the Gynaecologist/Radiologist/Registered Medical Practitioner conducting Diagnostic procedure.</strong></p>

</body>
`;

module.exports = formFTemplate;
