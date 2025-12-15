let follicularScanDaysTemplate = `
<tr style="background-color: #f8f0ff;">
    <th style="border: 1px solid #ccc; padding: 8px; text-align: left; background-color: #e6b3ff;">Follicular Scan</th>
    {{#each data}}
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D{{this.index}}<br>{{this.date}}</th>
    {{/each}}
</tr>
`

let follicularScanInputTemplate = `
<tr style="background-color: #f8f0ff;">
    <th style="border: 1px solid #ccc; padding: 8px;"></th>
    {{#each data}}
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
    {{/each}}
</tr>
`

let follicularScanMeasurementTemplate=  `
{{#each data}}
<tr>
    <td style="border: 1px solid #ccc; background-color: #e6ffb3;">
     <input type="text" style="width: 100%; cursor: not-allowed; background-color: #e6ffb3; border:none" disabled value="{{this.value}}">
    </td>
     {{#each this.data}}
        {{#ifCond this.index '<' 4}}
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
        {{/ifCond}}
        {{#ifCond this.index '>' 3}}
            <td style="border: 1.5px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 1.5px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
        {{/ifCond}}
    {{/each}}
</tr>
{{/each}}
`

let investigationDaysTemplate = `
<tr style="background-color: #f8f0ff;">
    <th style="border: 1px solid #ccc; padding: 8px; text-align: left; background-color: #e6b3ff;">Investigations</th>
    {{#each data}}
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D{{this.index}}<br>{{this.date}}</th>
    {{/each}}
</tr>
`

let investigationInputTemplate = `
<tr style="background-color: #f8f0ff;">
    <th style="border: 1px solid #ccc; padding: 8px;"></th>
    {{#each data}}
        <th style="border: 1px solid #ccc; padding: 8px;"></th>
        <th style="border: 1px solid #ccc; padding: 8px;"></th>
    {{/each}}
</tr>`

let investigationMeasurementTemplate = `
{{#each data}}
<tr>
    {{#ifCond this.value '!=' 'Blank'}}
            <td style="border: 1px solid #ccc; background-color: #e6ffb3;">
                <input type="text" style="width: 100%; cursor: not-allowed; background-color: #e6ffb3; border:none" disabled value="{{this.value}}">
            </td>
    {{/ifCond}}
    {{#ifCond this.value '==' 'Blank'}}
            <td style="border: 1px solid #ccc; background-color: #e6ffb3;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #e6ffb3;">{{this.value}}</span>
            </td>
    {{/ifCond}}
    {{#each this.data}}
        <td style="border: 1.5px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
        <td style="border: 1.5px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
        </td>
    {{/each}}
</tr>
{{/each}}
`

let medicationsDaysTemplate = `
<tr style="background-color: #f8f0ff;">
    <th style="border: 1px solid #ccc; padding: 8px; text-align: left; background-color: #e6b3ff;">Investigations</th>
    {{#each data}}
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D{{this.index}}<br>{{this.date}}</th>
    {{/each}}
</tr>
`

let medicationsInputTemplate = `
<tr style="background-color: #f8f0ff;">
    <th style="border: 1px solid #ccc; padding: 8px;"></th>
    {{#each data}}
        <th style="border: 1px solid #ccc; padding: 8px;"></th>
        <th style="border: 1px solid #ccc; padding: 8px;"></th>
    {{/each}}
</tr>
`

let medicationsMesaurementTemplate = `
{{#each data}}
<tr>
    {{#ifCond this.label '==' ''}}
            <td style="border: 1px solid #ccc; background-color: #e6ffb3;">
                <input type="text" style="width: 100%; cursor: not-allowed; background-color: #e6ffb3; border:none" disabled value="{{this.value}}">
            </td>
    {{/ifCond}}
    {{#ifCond this.label '==' 'Blank'}}
            <td style="border: 1px solid #ccc; background-color: #e6ffb3;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #e6ffb3;">{{this.value}}</span>
            </td>
    {{/ifCond}}
    {{#ifCond this.label '==' 'Tablet'}}
            <td style="border: 1px solid #ccc; background-color: #e6ffb3;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #e6ffb3;">{{this.value}}</span>
            </td>
    {{/ifCond}}
    {{#each this.data}}
        <td style="border: 1.5px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
        <td style="border: 1.5px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
        </td>
    {{/each}}
</tr>
{{/each}}
`

const combinedTemplate = `
    <html>
        <head><title>Treatement Sheets</title></head>
        <div>
            <div style="margin-bottom:15px">
                {{follicularTemplate}}
            </div>

            <div style="margin-bottom:15px">
                {{investigationsTemplate}}
            </div>

            <div style="margin-bottom:15px">
                {{pharmacyTemplate}}
            </div>
        </div>
    </html>
`

module.exports = {
    follicularScanDaysTemplate, follicularScanInputTemplate, follicularScanMeasurementTemplate,
    investigationDaysTemplate, investigationInputTemplate, investigationMeasurementTemplate,
    medicationsDaysTemplate, medicationsInputTemplate, medicationsMesaurementTemplate,
    combinedTemplate
}