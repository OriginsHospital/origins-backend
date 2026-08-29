const FET_IDS = new Set(["5"]);
const ICSI_IDS = new Set(["6"]);

const stripTags = html =>
  String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();

const normalizeName = value =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const isFetReport = ({ id, name } = {}) => {
  const idStr = String(id || "").trim();
  if (FET_IDS.has(idStr)) return true;
  const n = normalizeName(name);
  return /\bfet\b/.test(n) && n.includes("frozen");
};

const isIcsiReport = ({ id, name } = {}) => {
  const idStr = String(id || "").trim();
  if (ICSI_IDS.has(idStr)) return true;
  const n = normalizeName(name);
  return /\bicsi\b/.test(n);
};

const hasRenewalDate = html => /RENEWAL\s*DATE/i.test(String(html || ""));

const getRowCells = rowHtml => [
  ...String(rowHtml || "").matchAll(/<(t[dh])\b([^>]*)>([\s\S]*?)<\/t[dh]>/gi)
];

const addIcsiRenewalDateColumn = html => {
  if (!html || hasRenewalDate(html)) return html;

  return String(html).replace(
    /<table\b[^>]*>[\s\S]*?<\/table>/gi,
    tableHtml => {
      if (!/DATE\s+OF\s+FREEZING/i.test(tableHtml)) return tableHtml;
      if (!/STAGES\s*(?:&amp;|&)\s*GRADE/i.test(tableHtml)) return tableHtml;
      if (hasRenewalDate(tableHtml)) return tableHtml;

      let insertAt = -1;

      return tableHtml.replace(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi, rowHtml => {
        const cells = getRowCells(rowHtml);
        if (!cells.length) return rowHtml;

        if (insertAt === -1) {
          const dateIdx = cells.findIndex(cell =>
            /DATE\s+OF\s+FREEZING/i.test(stripTags(cell[3]))
          );
          if (dateIdx === -1) return rowHtml;

          insertAt = dateIdx + 1;
          const newHeader = `<${cells[dateIdx][1]}${
            cells[dateIdx][2]
          }>RENEWAL DATE</${cells[dateIdx][1]}>`;
          return rowHtml.replace(
            cells[dateIdx][0],
            `${cells[dateIdx][0]}\n                 ${newHeader}`
          );
        }

        if (cells.length < insertAt) return rowHtml;

        const refCell = cells[Math.min(insertAt, cells.length - 1)];
        const newEmpty = `<${refCell[1]}${refCell[2]}></${refCell[1]}>`;
        if (insertAt < cells.length) {
          return rowHtml.replace(
            cells[insertAt][0],
            `${newEmpty}\n                 ${cells[insertAt][0]}`
          );
        }
        return rowHtml.replace(/<\/tr>/i, `${newEmpty}</tr>`);
      });
    }
  );
};

const addFetRenewalDateRow = html => {
  if (!html || hasRenewalDate(html)) return html;

  let inserted = false;
  return String(html).replace(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi, rowHtml => {
    if (inserted) return rowHtml;
    const cells = getRowCells(rowHtml);
    const isThawingRow = cells.some(cell =>
      /DATE[\s\S]{0,20}TIME\s+OF\s+THAWING/i.test(stripTags(cell[3]))
    );
    if (!isThawingRow) return rowHtml;

    inserted = true;
    const label = cells[0];
    const value = cells[1] || cells[0];
    const labelTag = label ? label[1] : "td";
    const valueTag = value ? value[1] : "td";
    const labelOpen = label
      ? `<${label[1]}${label[2]}>`
      : '<td style="border: 1px solid #000; padding: 6px;">';
    const valueOpen = value
      ? `<${value[1]}${value[2]}>`
      : '<td style="border: 1px solid #000; padding: 6px;">';
    return `<tr>
                ${labelOpen}RENEWAL DATE</${labelTag}>
                ${valueOpen}</${valueTag}>
            </tr>
            ${rowHtml}`;
  });
};

const ensureFetIcsiRenewalDate = (html, report = {}) => {
  if (!html) return html;
  if (isIcsiReport(report)) return addIcsiRenewalDateColumn(html);
  if (isFetReport(report)) return addFetRenewalDateRow(html);
  return html;
};

const applyRenewalDateToEmbryologyRows = rows =>
  (rows || []).map(row => {
    const report = { id: row.embryologyType, name: row.embryologyName };
    if (!isFetReport(report) && !isIcsiReport(report)) return row;

    let details = row.embryologyDetails;
    if (typeof details === "string") {
      try {
        details = JSON.parse(details);
      } catch (err) {
        return row;
      }
    }
    if (!Array.isArray(details)) return row;

    return {
      ...row,
      embryologyDetails: details.map(detail => ({
        ...detail,
        template: ensureFetIcsiRenewalDate(detail.template, report)
      }))
    };
  });

module.exports = {
  isFetReport,
  isIcsiReport,
  addIcsiRenewalDateColumn,
  addFetRenewalDateRow,
  ensureFetIcsiRenewalDate,
  applyRenewalDateToEmbryologyRows
};
