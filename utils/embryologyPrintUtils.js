const TITLE_CLASS = "embryology-report-title";

const formatEmbryologyReportTitle = reportName => {
  const name = String(reportName || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!name) return "Embryology Report";
  if (/report$/i.test(name)) return name;
  return `${name} Report`;
};

const escapeHtml = value =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const stripTags = html =>
  String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const findMatchingCloseDiv = (html, openIndex) => {
  const firstClose = html.indexOf(">", openIndex);
  if (firstClose === -1) return -1;

  let depth = 1;
  const re = /<\/?div\b[^>]*>/gi;
  re.lastIndex = firstClose + 1;
  let match;
  while ((match = re.exec(html))) {
    const isClose = match[0].startsWith("</");
    const isSelfClose = /\/\s*>$/.test(match[0]);
    if (isClose) {
      depth -= 1;
      if (depth === 0) return match.index + match[0].length;
    } else if (!isSelfClose) {
      depth += 1;
    }
  }
  return -1;
};

const getTitleVariants = title => {
  const formatted = formatEmbryologyReportTitle(title);
  const withoutReport = formatted.replace(/\s*report$/i, "").trim();
  return [...new Set([formatted, withoutReport, title].filter(Boolean))];
};

const isTitleLikeText = (text, title) => {
  const normalized = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  return getTitleVariants(title).some(
    variant =>
      normalized ===
      String(variant)
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
  );
};

const stripExistingReportTitles = (html, title) => {
  let result = String(html || "").replace(
    new RegExp(
      `<div[^>]*class=["'][^"']*${TITLE_CLASS}[^"']*["'][^>]*>[\\s\\S]*?<\\/div>`,
      "gi"
    ),
    ""
  );

  const headerMarker = result.search(/alt=["']Hospital Logo["']/i);
  const scanLimit = headerMarker === -1 ? result.length : headerMarker;
  const leading = result.slice(0, scanLimit);
  const rest = result.slice(scanLimit);

  const cleanedLeading = leading.replace(
    /<(h[1-6]|p|div)[^>]*>([\s\S]*?)<\/\1>/gi,
    (full, tag, inner) => {
      if (tag.toLowerCase() === "div" && /<(div|table|img)\b/i.test(inner)) {
        return full;
      }
      return isTitleLikeText(stripTags(inner), title) ? "" : full;
    }
  );

  return `${cleanedLeading}${rest}`;
};

const injectEmbryologyReportTitle = (html, reportName) => {
  const source = String(html || "");
  const title = formatEmbryologyReportTitle(reportName);
  const withoutOldTitles = stripExistingReportTitles(source, title);
  const titleHtml = `<div class="${TITLE_CLASS}" style="text-align:center;font-size:18px;font-weight:700;line-height:1.3;margin:10px 0 12px;letter-spacing:0.4px;text-transform:uppercase;">${escapeHtml(
    title
  )}</div>`;

  const headerOpen = withoutOldTitles.match(
    /<div\b[^>]*border-bottom:\s*2px\s+solid\s+(?:black|#000)[^>]*>/i
  );
  if (headerOpen && typeof headerOpen.index === "number") {
    const headerEnd = findMatchingCloseDiv(withoutOldTitles, headerOpen.index);
    if (headerEnd !== -1) {
      return (
        withoutOldTitles.slice(0, headerEnd) +
        titleHtml +
        withoutOldTitles.slice(headerEnd)
      );
    }
  }

  const logoIndex = withoutOldTitles.search(/alt=["']Hospital Logo["']/i);
  if (logoIndex !== -1) {
    const possibleStart = withoutOldTitles.lastIndexOf("<div", logoIndex);
    if (possibleStart !== -1) {
      const outerStart = withoutOldTitles.lastIndexOf(
        "<div",
        possibleStart - 1
      );
      const start = outerStart !== -1 ? outerStart : possibleStart;
      const headerEnd = findMatchingCloseDiv(withoutOldTitles, start);
      if (headerEnd !== -1) {
        return (
          withoutOldTitles.slice(0, headerEnd) +
          titleHtml +
          withoutOldTitles.slice(headerEnd)
        );
      }
    }
  }

  return `${titleHtml}${withoutOldTitles}`;
};

const EMBRYOLOGY_PDF_STYLES = `
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      line-height: 1.35;
      margin: 0;
      padding: 0;
      color: #000;
      background: #fff;
    }

    .${TITLE_CLASS} {
      display: block !important;
      text-align: center !important;
      font-size: 18px !important;
      font-weight: 700 !important;
      line-height: 1.3 !important;
      margin: 10px 0 12px !important;
      padding: 0 !important;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }

    table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 0 0 8px !important;
      font-size: 13px !important;
    }

    th, td {
      padding: 5px 7px !important;
      font-size: 13px !important;
      line-height: 1.35 !important;
      border: 1px solid #000 !important;
      vertical-align: top !important;
    }

    th {
      font-weight: 700 !important;
      background-color: #f5f5f5 !important;
    }

    p, span, li {
      font-size: 13px !important;
      line-height: 1.35 !important;
    }

    h1 { font-size: 18px !important; margin: 6px 0 !important; }
    h2 { font-size: 16px !important; margin: 6px 0 !important; }
    h3, h4, h5, h6 { font-size: 14px !important; margin: 4px 0 !important; }

    img[alt="Hospital Logo"] {
      width: 140px !important;
      max-width: 140px !important;
      height: auto !important;
      max-height: none !important;
    }

    .header-branch-address,
    .header-branch-address * {
      font-size: 11px !important;
      font-weight: 700 !important;
    }
  </style>
`;

module.exports = {
  TITLE_CLASS,
  formatEmbryologyReportTitle,
  injectEmbryologyReportTitle,
  EMBRYOLOGY_PDF_STYLES
};
