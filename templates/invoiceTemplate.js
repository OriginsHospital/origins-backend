let invoiceTemplate = `
<div style="width: 148mm; height: 210mm; margin: 0 auto; padding: 6mm 5mm 6mm 25mm; box-sizing: border-box; font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; page-break-after: always;">
    
    {{{hospitalLogoInformation}}}

    {{{patientHeaderInformation}}}

    <h3 style="font-size: 19px; font-weight: 700; color: black; text-align: center; margin: 8px 0;">Purchase Details</h3>
    
    <div style="width: 100%; margin-top: 5px;">
        {{#if isPharmacy}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 15px; font-weight: 700; border: 1px solid #000; border-collapse: collapse;">
            <tr>
                <th style="width: 8%; padding: 4px; text-align: left; font-weight: 700;">S.No</th>
                <th style="width: 24%; padding: 4px; text-align: left; font-weight: 700;">Item Name</th>
                <th style="width: 18%; padding: 4px; text-align: left; font-weight: 700;">Batch Number</th>
                <th style="width: 14%; padding: 4px; text-align: left; font-weight: 700;">Prescribe Qty</th>
                <th style="width: 14%; padding: 4px; text-align: left; font-weight: 700;">Purchase Qty</th>
                <th style="width: 14%; padding: 4px; text-align: left; font-weight: 700;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 4px; font-weight: 700;">{{this.serialNumber}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.itemName}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.batchNo}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.presQty}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.purcQty}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
            <tr>
                <td colspan="6"><hr></td>
            </tr>
            
            <tr>
                <td colspan="3" style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td colspan="3" style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td colspan="3" style="padding: 4px; font-weight: 700;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td colspan="3" style="padding: 4px; font-weight: 700;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="6" style="padding: 4px; font-weight: 700;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            
        </table>
        
        {{/if}}
        
        {{#if isScan}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 15px; font-weight: 700; border: 1px solid #000; border-collapse: collapse;">
            <tr>
                <th style="width: 10%; padding: 4px; text-align: left; font-weight: 700;">S.No.</th>
                <th style="width: 60%; padding: 4px; text-align: left; font-weight: 700;">Scan</th>
                <th style="width: 30%; padding: 4px; text-align: left; font-weight: 700;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 4px; font-weight: 700;">{{this.serialNumber}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.itemName}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
             <tr>
                <td colspan="3"><hr></td>
            </tr>
            
            <tr>
                <td style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td style="padding: 4px; font-weight: 700;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td style="padding: 4px; font-weight: 700;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 4px; font-weight: 700;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            
        </table>
        
        {{/if}}
        
        {{#if isLab}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 15px; font-weight: 700; border: 1px solid #000; border-collapse: collapse;">
            <tr>
                <th style="width: 10%; padding: 4px; text-align: left; font-weight: 700;">S.No.</th>
                <th style="width: 60%; padding: 4px; text-align: left; font-weight: 700;">Lab Test</th>
                <th style="width: 30%; padding: 4px; text-align: left; font-weight: 700;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 4px; font-weight: 700;">{{this.serialNumber}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.itemName}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
             <tr>
                <td colspan="3"><hr></td>
            </tr>
            
            <tr>
                <td style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td style="padding: 4px; font-weight: 700;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td style="padding: 4px; font-weight: 700;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 4px; font-weight: 700;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            
        </table>
        
        {{/if}}
        
        {{#if isEmbryology}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 15px; font-weight: 700; border: 1px solid #000; border-collapse: collapse;">
            <tr>
                <th style="width: 10%; padding: 4px; text-align: left; font-weight: 700;">S.No.</th>
                <th style="width: 60%; padding: 4px; text-align: left; font-weight: 700;">Embryology</th>
                <th style="width: 30%; padding: 4px; text-align: left; font-weight: 700;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 4px; font-weight: 700;">{{this.serialNumber}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.itemName}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
             <tr>
                <td colspan="3"><hr></td>
            </tr>
            
            <tr>
                <td style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td style="padding: 4px; font-weight: 700;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td style="padding: 4px; font-weight: 700;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 4px; font-weight: 700;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            
        </table>
        
        {{/if}}
        
        {{#if isConsultationFee}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 15px; font-weight: 700; border: 1px solid #000; border-collapse: collapse;">
            <tr>
                <th style="width: 10%; padding: 4px; text-align: left; font-weight: 700;">S.No.</th>
                <th style="width: 60%; padding: 4px; text-align: left; font-weight: 700;">Order Type</th>
                <th style="width: 30%; padding: 4px; text-align: left; font-weight: 700;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 4px; font-weight: 700;">{{this.serialNumber}}</td>
                <td style="padding: 4px; font-weight: 700;">Consultation Fee</td>
                <td style="padding: 4px; font-weight: 700;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
             <tr>
                <td colspan="3"><hr></td>
            </tr>
            
            <tr>
                <td style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td style="padding: 4px; font-weight: 700;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td style="padding: 4px; font-weight: 700;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 4px; font-weight: 700;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            
        </table>
        
        {{/if}}
        
        {{#if isMileStone}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 15px; font-weight: 700; border: 1px solid #000; border-collapse: collapse;">
            <tr>
                <th style="width: 10%; padding: 4px; text-align: left; font-weight: 700;">S.No.</th>
                <th style="width: 60%; padding: 4px; text-align: left; font-weight: 700;">Milestone</th>
                <th style="width: 30%; padding: 4px; text-align: left; font-weight: 700;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 4px; font-weight: 700;">{{this.serialNumber}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.itemName}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
             <tr>
                <td colspan="3"><hr></td>
            </tr>
            
            <tr>
                <td colspan="2" style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 4px; font-weight: 700;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td style="padding: 4px; font-weight: 700;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="3" style="padding: 4px; font-weight: 700;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            
        </table>
        {{/if}}
        
        {{#if isAppointment}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 15px; font-weight: 700; border: 1px solid #000; border-collapse: collapse;">
            <tr>
                <th style="width: 10%; padding: 4px; text-align: left; font-weight: 700;">S.No.</th>
                <th style="width: 60%; padding: 4px; text-align: left; font-weight: 700;">Appointment Reason</th>
                <th style="width: 30%; padding: 4px; text-align: left; font-weight: 700;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 4px; font-weight: 700;">{{this.serialNumber}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.itemName}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
            <tr>
                <td colspan="3"><hr></td>
            </tr>
            
            <tr>
                <td style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td style="padding: 4px; font-weight: 700;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td style="padding: 4px; font-weight: 700;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 4px; font-weight: 700;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            
        </table>
        {{/if}}

        {{#if isAdvancePayment}}
        <table style="width: 100%; padding: 5px; margin-bottom: 5px; font-size: 15px; font-weight: 700; border: 1px solid #000; border-collapse: collapse;">
            <tr>
                <th style="width: 10%; padding: 4px; text-align: left; font-weight: 700;">S.No.</th>
                <th style="width: 60%; padding: 4px; text-align: left; font-weight: 700;">Payment Reason</th>
                <th style="width: 30%; padding: 4px; text-align: left; font-weight: 700;">Rate</th>
            </tr>
            {{#each productTable}}
            <tr>
                <td style="padding: 4px; font-weight: 700;">{{this.serialNumber}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.itemName}}</td>
                <td style="padding: 4px; font-weight: 700;">{{this.totalCost}}</td>
            </tr>
            {{/each}}
            
            <tr>
                <td colspan="3"><hr></td>
            </tr>
            
            <tr>
                <td style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>Grand Total:</strong> {{Currency}}.{{totalAmount}}
                </td>
                <td style="width: 50%; padding: 4px; font-weight: 700;">
                    <strong>GST:</strong> {{Currency}}.{{gst}}
                </td>
            </tr>
            <tr>
                <td style="padding: 4px; font-weight: 700;">
                    <strong>Discount:</strong> {{Currency}}.{{discount}}
                </td>
                <td style="padding: 4px; font-weight: 700;">
                    <strong>Amount Paid:</strong> {{Currency}}.{{paidAmount}}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 4px; font-weight: 700;">
                    <strong>Amount in Words:</strong> {{amountInWords}}
                </td>
            </tr>
            {{#if isSplitPayment}}
            <tr>
                <td colspan="2" style="padding: 4px; font-weight: 700;">
                    <strong>Split Payment:</strong>
                    Cash {{Currency}}.{{splitCashAmount}} |
                    UPI {{Currency}}.{{splitUpiAmount}}
                </td>
            </tr>
            {{#if splitPaymentSummary}}
            <tr>
                <td colspan="2" style="padding: 4px; font-weight: 700;">
                    <strong>Payment Division:</strong> {{splitPaymentSummary}}
                </td>
            </tr>
            {{/if}}
            {{/if}}
            
        </table>
        {{/if}}
    </div>

    <div style="margin-top: 25px; font-size: 15px; font-weight: 700; text-align: right;">
        <p>Authorized Signature</p>
    </div>

</div>
`;

module.exports = {
  invoiceTemplate
};
