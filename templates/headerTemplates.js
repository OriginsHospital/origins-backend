const scanHeaderTemplate = `
<div style="border: 1px solid #000; padding: 5px; margin: auto; font-family: Arial, sans-serif; font-size: 14px;pointer-events: none; user-select: none;">
    <div style="display: flex; justify-content: space-between;">
        <div>
            <p><strong>ID</strong> : {patientId}</p>
            <p><strong>Age</strong> : {age}Y/{gender}</p>
            <p><strong>Date</strong> : {requestDateTime} </p>
        </div>
        <div>
            <p><strong>Name</strong> : {patientName}</p>
            <p><strong>Mobile</strong> : {mobileNumber}</p>
        </div>
    </div>
</div>
`;

const labHeaderTemplate = `
<div contenteditable="false" style="border: 1px solid #000; padding: 5px; margin: auto; font-family: Arial, sans-serif; font-size: 14px;pointer-events: none; user-select: none;">
    <div style="display: flex; justify-content: space-between;">
        <div>
            <p><strong>ID</strong> : {patientId}</p>
            <p><strong>Age / Gender</strong> : {age}Y/{gender}</p>
            <p><strong>Sample Type</strong> : {sampleType}</p>
            <p><strong>Doctor</strong> : {doctorName}</p>
        </div>
        <div>
            <p><strong>Name</strong> : {patientName}</p>
            <p><strong>Order Date</strong> : {requestDate}</p>
            <p><strong>Collection Date</strong> : {sampleCollectionOn}</p>
            <p><strong>Report Date</strong> : </p>
        </div>
    </div>
</div>
`;

const hospitalLogoTemplate = `
<div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid black; padding: 10px; background-color: rgba(255, 255, 255, 0.8); position: relative;margin:5px">
    <div style="content: ''; background-image: url('image.png'); background-size: cover; background-position: center; opacity: 0.3; position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: -1;"></div>
    <div style="display: flex; flex-direction: column; align-items: center; z-index: 1;">
        <img src="https://origins-hms.s3.amazonaws.com/base/uploads/OriginsNewLogo_1742044006551" alt="Hospital Logo" style="width: 120px; height: auto;">
        <div style="font-size: 12px; margin-top: 5px;color: black">{logoText}</div>
    </div>

    <!-- Hospital Info -->
    <div style="text-align: center; flex-grow: 1; z-index: 1;">
        <!-- Big Title in the Middle -->
        <div style="font-size: 30px; font-weight: bold; color: #0073e6; margin-bottom: 5px;">ORIGINS IVF</div>
        <div style="font-size: 14px; font-weight: bold; color: black; margin-bottom: 5px;">{branchName}</div>
        <div style="font-size: 12px; color: black; margin-bottom: 5px;">
        {branchAddress}
        </div>
        <div style="font-size: 12px; color: black;">Phone: {branchPhoneNumber}</div>
    </div>
</div>
`;

const hopsitalLogoTemplateForInvoice = `
<div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid black; padding: 3px 0; margin: 2px 0; position: relative;">
    <div style="display: flex; flex-direction: column; align-items: center; z-index: 1;">
        <img src="https://origins-hms.s3.amazonaws.com/base/uploads/OriginsNewLogo_1742044006551" alt="Hospital Logo" style="width: 60px; height: auto;">
        <div style="font-size: 8px; margin-top: 2px; color: black;">{logoText}</div>
    </div>

    <!-- Hospital Info -->
    <div style="text-align: center; flex-grow: 1; z-index: 1; padding: 0 5px;">
        <!-- Big Title in the Middle -->
        <div style="font-size: 12px; font-weight: bold; color: #0073e6; margin-bottom: 10px;">ORIGINS IVF</div>
        <div style="font-size: 8px; font-weight: bold; color: black; margin-bottom: 5px;">{branchName}</div>
        <div style="font-size: 7px; color: black; margin-bottom: 5px;">
        {branchAddress}
        </div>
        <div style="font-size: 8px; color: black;">Phone: {branchPhoneNumber}</div>
    </div>
</div>
`;

let patientHeaderForInvoice = `
<table style="width: 100%; padding:5px; margin-bottom: 5px; margin-top: 5px; font-size: 8px;border: 1px solid #000;">
    <tr>
        <td style="width: 50%; padding: 2px; ">
            <strong>Order No:</strong> {{orderNo}}
        </td>
        <td style="width: 50%; padding: 2px; ">
            <strong>Order Date:</strong> {{orderDate}}
        </td>
    </tr>
    <tr>
        <td style="width: 50%; padding: 2px;">
            <strong>Patient Id:</strong> {{patientId}}
        </td>
        <td style="width: 50%; padding: 2px;">
            <strong>Patient Name:</strong> {{name}}
        </td>
    </tr>
    <tr>
        <td style="padding: 2px;">
            <strong>Consultant Name:</strong> {{doctorName}}
        </td>
        <td style="padding: 2px;">
            <strong>Age / Gender:</strong> {{ageGender}}
        </td>
    </tr>
    <tr>
        <td style="padding: 2px;">
            <strong>Phone:</strong> {{mobileNumber}}
        </td>
            <td style="padding: 2px; ">
            <strong>Payment Mode:</strong> {{paymentMode}}
        </td>
    </tr>
</table>
<hr style="border: 0; height: 1px; background: black; margin: 5px 0;">
`;

module.exports = {
  scanHeaderTemplate,
  labHeaderTemplate,
  hospitalLogoTemplate,
  hopsitalLogoTemplateForInvoice,
  patientHeaderForInvoice
};
