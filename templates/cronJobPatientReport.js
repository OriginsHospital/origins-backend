const patientReportCronTemplate = `
    <!DOCTYPE html>
  <html>
<head>
    <meta charset="utf-8" />
    <title>Origins</title>
</head> 
<body>
    <table width="650" border="0" cellspacing="0" cellpadding="0" align="center" style="font-family: Arial, Helvetica, sans-serif; background: #FFFFFF; padding-bottom: 40px;">
        <tr style="background-color: #B0E9FA; padding: 20px; display: block;">
            <td>
                <table width="650" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td width="200">
                            <a href="https://originsivf.com/" target="_blank">
                                <img src="https://origins-hms.s3.ap-south-1.amazonaws.com/originslogo.png" alt="" border="0" vspace="0" width="80" height="80" hspace="0" style="display: block" />
                        </td>
                        <td width="250" style="text-align: center; font-weight: bold; font-size:20px">
							<p style="margin: 0;">Patient Purchase Report</p>
						</td>
                        <td width="200" style="text-align: right;">
                            <span style="color: #2F3043;
                          font-size: 14px;
                          font-weight: 700;
                          line-height: normal;">Date</span>
                            <br/>
                            <span style="color: #8A8CA4;
                          text-align: right;
                          font-size: 14px;
                          font-weight: 400;
                          line-height: normal;
                          letter-spacing: 0.125px;">{dateOfJob}</span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr style="padding: 0px 20px 0 20px; display: block; margin-bottom: 2px; ">
            <td style="background-color: #FFFFFF; padding: 8px 0;">
                <table width="650" border="0" cellspacing="0" cellpadding="0">
                    {patientInformation}
                </table>
            </td>
        </tr>
    </table>
    <hr style='page-break-after: always;' />
</body>
</html>
`;

module.exports = patientReportCronTemplate;
