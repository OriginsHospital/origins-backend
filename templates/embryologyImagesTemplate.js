const embryologyImagesTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>Emryology Images</title>
</head>
<body style="margin:0; font-family:sans-serif;">

  {{#each paginatedImages}}
    <div style="width:210mm; height:297mm; padding:20mm; margin:10px auto; background:white; box-sizing:border-box; page-break-after:always; display:flex; flex-wrap:wrap; justify-content:space-between; align-content:flex-start;">
      {{#each this}}
        <div style="width:48%; margin-bottom:10mm; box-sizing:border-box;">
          <img src="{{this.url}}" alt="Image" style="width:100%; height:auto; max-height:120mm; object-fit:contain; border:1px solid #ccc;" />
        </div>
      {{/each}}
    </div>
  {{/each}}

</body>
</html>

`;

module.exports = { embryologyImagesTemplate };
