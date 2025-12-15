let invoiceTemplate = `
<div style="width: 148mm; height: 210mm; margin: 0 auto; padding: 5mm; box-sizing: border-box; font-family: Arial, sans-serif; font-size: 9px; page-break-after: always;">
    
    {{{hospitalLogoInformation}}}

    {{{patientHeaderInformation}}}

    <h3 style="font-size: 12px; font-weight: bold; color: black; text-align: center; margin: 5px 0;">Purchase Details</h3>
    
    <div style="width: 100%; margin-top: 5px;">
        {{#if isPharmacy}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 8px; border: 1px solid #000;">
            <tr>
                <th style="width: 10%; padding: 2px; text-align: left;">S.No</th>
                <th style="width: 30%; padding: 2px; text-align: left;">Item Name</th>
                <th style="width: 20%; padding: 2px; text-align: left;">Prescribe Qty</th>
                <th style="width: 20%; padding: 2px; text-align: left;">Purchase Qty</th>
                <th style="width: 20%; padding: 2px; text-align: left;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 2px;">{{this.serialNumber}}</td>
                <td style="padding: 2px;">{{this.itemName}}</td>
                <td style="padding: 2px;">{{this.presQty}}</td>
                <td style="padding: 2px;">{{this.purcQty}}</td>
                <td style="padding: 2px;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
            <tr>
                <td colspan="5"><hr></td>
            </tr>
            
            <tr>
                <td colspan="2" style="width: 50%; padding: 2px;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td colspan="3" style="width: 50%; padding: 2px;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 2px;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td colspan="3" style="padding: 2px;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="5" style="padding: 2px;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            
        </table>
        
        {{/if}}
        
        {{#if isScan}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 8px; border: 1px solid #000;">
            <tr>
                <th style="width: 10%; padding: 2px; text-align: left;">S.No.</th>
                <th style="width: 60%; padding: 2px; text-align: left;">Scan</th>
                <th style="width: 30%; padding: 2px; text-align: left;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 2px;">{{this.serialNumber}}</td>
                <td style="padding: 2px;">{{this.itemName}}</td>
                <td style="padding: 2px;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
             <tr>
                <td colspan="3"><hr></td>
            </tr>
            
            <tr>
                <td style="width: 50%; padding: 2px;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td style="width: 50%; padding: 2px;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td style="padding: 2px;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td style="padding: 2px;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 2px;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            
        </table>
        
        {{/if}}
        
        {{#if isLab}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 8px; border: 1px solid #000;">
            <tr>
                <th style="width: 10%; padding: 2px; text-align: left;">S.No.</th>
                <th style="width: 60%; padding: 2px; text-align: left;">Lab Test</th>
                <th style="width: 30%; padding: 2px; text-align: left;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 2px;">{{this.serialNumber}}</td>
                <td style="padding: 2px;">{{this.itemName}}</td>
                <td style="padding: 2px;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
             <tr>
                <td colspan="3"><hr></td>
            </tr>
            
            <tr>
                <td style="width: 50%; padding: 2px;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td style="width: 50%; padding: 2px;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td style="padding: 2px;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td style="padding: 2px;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 2px;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            
        </table>
        
        {{/if}}
        
        {{#if isEmbryology}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 8px; border: 1px solid #000;">
            <tr>
                <th style="width: 10%; padding: 2px; text-align: left;">S.No.</th>
                <th style="width: 60%; padding: 2px; text-align: left;">Embryology</th>
                <th style="width: 30%; padding: 2px; text-align: left;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 2px;">{{this.serialNumber}}</td>
                <td style="padding: 2px;">{{this.itemName}}</td>
                <td style="padding: 2px;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
             <tr>
                <td colspan="3"><hr></td>
            </tr>
            
            <tr>
                <td style="width: 50%; padding: 2px;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td style="width: 50%; padding: 2px;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td style="padding: 2px;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td style="padding: 2px;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 2px;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            
        </table>
        
        {{/if}}
        
        {{#if isConsultationFee}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 8px; border: 1px solid #000;">
            <tr>
                <th style="width: 10%; padding: 2px; text-align: left;">S.No.</th>
                <th style="width: 60%; padding: 2px; text-align: left;">Order Type</th>
                <th style="width: 30%; padding: 2px; text-align: left;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 2px;">{{this.serialNumber}}</td>
                <td style="padding: 2px;">Consultation Fee</td>
                <td style="padding: 2px;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
             <tr>
                <td colspan="3"><hr></td>
            </tr>
            
            <tr>
                <td style="width: 50%; padding: 2px;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td style="width: 50%; padding: 2px;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td style="padding: 2px;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td style="padding: 2px;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 2px;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            
        </table>
        
        {{/if}}
        
        {{#if isMileStone}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 8px; border: 1px solid #000;">
            <tr>
                <th style="width: 10%; padding: 2px; text-align: left;">S.No.</th>
                <th style="width: 60%; padding: 2px; text-align: left;">Milestone</th>
                <th style="width: 30%; padding: 2px; text-align: left;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 2px;">{{this.serialNumber}}</td>
                <td style="padding: 2px;">{{this.itemName}}</td>
                <td style="padding: 2px;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
             <tr>
                <td colspan="3"><hr></td>
            </tr>
            
            <tr>
                <td style="width: 50%; padding: 2px;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td style="width: 50%; padding: 2px;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td style="padding: 2px;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td style="padding: 2px;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 2px;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            
        </table>
        {{/if}}
        
        {{#if isAppointment}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 8px; border: 1px solid #000;">
            <tr>
                <th style="width: 10%; padding: 2px; text-align: left;">S.No.</th>
                <th style="width: 60%; padding: 2px; text-align: left;">Appointment Reason</th>
                <th style="width: 30%; padding: 2px; text-align: left;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 2px;">{{this.serialNumber}}</td>
                <td style="padding: 2px;">{{this.itemName}}</td>
                <td style="padding: 2px;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
            <tr>
                <td colspan="3"><hr></td>
            </tr>
            
            <tr>
                <td style="width: 50%; padding: 2px;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td style="width: 50%; padding: 2px;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td style="padding: 2px;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td style="padding: 2px;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 2px;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            
        </table>
        {{/if}}

        {{#if isAdvancePayment}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 8px; border: 1px solid #000;">
            <tr>
                <th style="width: 10%; padding: 2px; text-align: left;">S.No.</th>
                <th style="width: 60%; padding: 2px; text-align: left;">Payment Reason</th>
                <th style="width: 30%; padding: 2px; text-align: left;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 2px;">{{this.serialNumber}}</td>
                <td style="padding: 2px;">{{this.itemName}}</td>
                <td style="padding: 2px;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
            <tr>
                <td colspan="3"><hr></td>
            </tr>
            
            <tr>
                <td style="width: 50%; padding: 2px;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td style="width: 50%; padding: 2px;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td style="padding: 2px;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td style="padding: 2px;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 2px;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            
        </table>
        {{/if}}
    </div>

    <div style="margin-top: 25px; font-size: 9px; text-align: right;">
        <p>Authorized Signature</p>
    </div>

</div>
`;

module.exports = {
  invoiceTemplate
};
