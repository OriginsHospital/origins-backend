const SCAN_REPORT_FOOTER_HTML = `<table class="scan-report-footer" style="width:100%;border-collapse:collapse;margin-top:8px;page-break-inside:avoid;break-inside:avoid;">
  <tr>
    <td style="border:none !important;text-align:left;padding:0;width:50%;">Please correlate clinically</td>
    <td style="border:none !important;text-align:right;padding:0;width:50%;">Consultant</td>
  </tr>
</table>`;

const SCAN_PDF_STYLES = `
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  html, body {
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    width: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    background: #fff;
  }

  p {
    margin: 2px 0 !important;
  }

  [style*="line-height: 1.6"] {
    line-height: 1.3 !important;
  }

  div[style*="margin-bottom: 20px"],
  table[style*="margin-bottom: 20px"] {
    margin-bottom: 8px !important;
  }

  tr, td, th {
    height: auto !important;
  }

  img[alt="Hospital Logo"] {
    width: 100px !important;
    max-width: 100px !important;
    max-height: 72px !important;
    height: auto !important;
  }

  .scan-report-footer,
  .scan-report-footer tr,
  .scan-report-footer td,
  .scan-report-closing {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    page-break-before: avoid !important;
    break-before: avoid !important;
  }

  .scan-report-footer td {
    border: none !important;
    padding: 0 !important;
    background: transparent !important;
  }
</style>
`;

function replaceConsultantFooter(html) {
  return String(html || "").replace(
    /<div[^>]*>\s*<div[^>]*>\s*Please correlate clinically\s*<\/div>\s*<div[^>]*>\s*Consultant\s*<\/div>\s*<\/div>/gi,
    SCAN_REPORT_FOOTER_HTML
  );
}

function wrapImpressionWithFooter(html) {
  const source = String(html || "");
  if (/scan-report-closing/i.test(source)) return source;
  return source.replace(
    /(<p[^>]*>[\s\S]*?IMPRESSION[\s\S]*?<\/p>)(\s*)(<table class="scan-report-footer"[\s\S]*?<\/table>)/i,
    '<div class="scan-report-closing">$1$2$3</div>'
  );
}

function stripBrokenHeadArtifacts(html) {
  let out = String(html || "");
  out = out.replace(
    /<p>\s*(?:<meta[^>]*>\s*)+(?:<title>[\s\S]*?<\/title>\s*)?<\/p>/gi,
    ""
  );
  out = out.replace(/<meta[^>]*>/gi, "");
  out = out.replace(/<title>[\s\S]*?<\/title>/gi, "");
  return out;
}

function compactScanTemplateForPrint(html) {
  let out = String(html || "");

  out = out.replace(/min-height\s*:\s*297mm/gi, "min-height: auto");
  out = out.replace(/height\s*:\s*297mm/gi, "height: auto");
  out = out.replace(/width\s*:\s*210mm/gi, "width: 100%");

  out = out.replace(
    /@page\s*\{[\s\S]*?\}/gi,
    "@page { size: A4 portrait; margin: 8mm 10mm; }"
  );

  out = out.replace(/padding:\s*5mm\s+5mm\s+5mm\s+22mm/gi, "padding: 5mm 8mm");
  out = out.replace(
    /padding:\s*10mm\s+10mm\s+10mm\s+20mm/gi,
    "padding: 6mm 8mm"
  );

  out = out.replace(/margin-top:\s*40px/gi, "margin-top: 10px");
  out = replaceConsultantFooter(out);
  out = wrapImpressionWithFooter(out);

  return out;
}

function injectPdfStyles(html) {
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${SCAN_PDF_STYLES}</head>`);
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html[^>]*>/i, `$&<head>${SCAN_PDF_STYLES}</head>`);
  }
  return html;
}

function prepareScanReportForPdf(html) {
  let out = compactScanTemplateForPrint(html);
  out = stripBrokenHeadArtifacts(out);

  if (/<html/i.test(out)) {
    return injectPdfStyles(out);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${SCAN_PDF_STYLES}
</head>
<body>
  ${out}
</body>
</html>`;
}

function computeFitToSinglePageScale(contentHeightPx) {
  const mmToPx = 96 / 25.4;
  const printableHeightPx = (297 - 16) * mmToPx;
  const height = Number(contentHeightPx) || 0;
  if (height <= printableHeightPx) return 1;

  const ratio = height / printableHeightPx;
  // Squeeze only slight overflow, e.g. the consultant footer slipping to page 2.
  // Leave genuine multi-page scans (TIFFA, twins, etc.) unscaled.
  if (ratio > 1.28) return 1;
  return Math.max(0.8, Number((printableHeightPx / height).toFixed(3)));
}

module.exports = {
  SCAN_PDF_STYLES,
  SCAN_REPORT_FOOTER_HTML,
  compactScanTemplateForPrint,
  prepareScanReportForPdf,
  computeFitToSinglePageScale,
  replaceConsultantFooter
};
