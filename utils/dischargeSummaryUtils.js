const escapeHtml = value =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const applyPlaceholderReplacements = (template, context) => {
  const safe = {
    patientName: escapeHtml(context.patientName),
    husbandName: escapeHtml(context.husbandName),
    patientAge: escapeHtml(context.patientAge),
    husbandAge: escapeHtml(context.husbandAge),
    doctorName: escapeHtml(context.doctorName),
    embryologistName: escapeHtml(context.embryologistName),
    planOfCycle: escapeHtml(context.planOfCycle),
    comments: escapeHtml(context.comments)
  };

  return template
    .replaceAll("{{patientName}}", safe.patientName)
    .replaceAll("{{husbandName}}", safe.husbandName)
    .replaceAll("{{patientAge}}", safe.patientAge)
    .replaceAll("{{husbandAge}}", safe.husbandAge)
    .replaceAll("{{doctorName}}", safe.doctorName)
    .replaceAll("{{embryologistName}}", safe.embryologistName)
    .replaceAll("{{planOfCycle}}", safe.planOfCycle)
    .replaceAll("{{comments}}", safe.comments);
};

const fillLegacyEmptyCells = (template, context) => {
  let result = template;

  if (context.doctorName) {
    result = result.replace(
      /(>\s*DOCTOR NAME\s*<\/td>\s*<td[^>]*>)\s*(<\/td>)/i,
      `$1${escapeHtml(context.doctorName)}$2`
    );
    result = result.replace(
      /(>\s*DOCTOR NAME\s*<\/div>\s*<div>)\s*(<\/div>)/i,
      `$1${escapeHtml(context.doctorName)}$2`
    );
  }

  if (context.embryologistName) {
    result = result.replace(
      /(>\s*EMBRYOLOGIST NAME\s*<\/td>\s*<td[^>]*>)\s*(<\/td>)/i,
      `$1${escapeHtml(context.embryologistName)}$2`
    );
    result = result.replace(
      /(>\s*EMBRYOLOGIST NAME\s*<\/div>\s*<div>)\s*(<\/div>)/i,
      `$1${escapeHtml(context.embryologistName)}$2`
    );
  }

  if (context.planOfCycle) {
    result = result.replace(
      /(>\s*PLAN OF CYCLE\s*<\/td>\s*<\/tr>\s*<tr>\s*<td[^>]*>\s*TOTAL NO OF OOCYTES)/i,
      `>PLAN OF CYCLE </td>
    </tr>
    <tr>
        <td colspan="4" style="border: 1px solid black; padding: 5px;">${escapeHtml(
          context.planOfCycle
        )}</td>
    </tr>
    <tr>
        <td style="border: 1px solid black; padding: 5px; ">TOTAL NO OF OOCYTES`
    );
    result = result.replace(
      /(>\s*PLAN OF CYCLE\s*<\/td>\s*<\/tr>)(\s*<tr>\s*<td[^>]*>\s*TOTAL NO OF OOCYTES)/i,
      `$1
    <tr>
        <td colspan="4" style="border: 1px solid black; padding: 5px;">${escapeHtml(
          context.planOfCycle
        )}</td>
    </tr>$2`
    );
  }

  if (context.comments) {
    result = result.replace(
      /(COMMENTS:[\s\S]*?<p>)\s*(<\/p>)/i,
      `$1${escapeHtml(context.comments)}$2`
    );
  }

  return result;
};

const applyDischargeSummaryContext = (template, context = {}) => {
  if (!template) return "";
  const withPlaceholders = applyPlaceholderReplacements(template, context);
  return fillLegacyEmptyCells(withPlaceholders, context);
};

module.exports = {
  applyDischargeSummaryContext
};
