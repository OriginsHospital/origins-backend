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

const normalizeForCompare = value =>
  String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#\d+;/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(report|the|of|and|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isMostlyUpperCase = text => {
  const letters = String(text || "").replace(/[^a-zA-Z]/g, "");
  if (letters.length < 3) return false;
  return letters.replace(/[^A-Z]/g, "").length / letters.length >= 0.6;
};

const countTextCells = rowHtml =>
  [
    ...String(rowHtml || "").matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)
  ].filter(cell => stripTags(cell[1])).length;

const isTitleLikeText = (text, title, rawHtml = "") => {
  const raw = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw || raw.length > 100) return false;
  if (/[:=]/.test(raw)) return false;

  const normalized = raw.toLowerCase();
  if (
    getTitleVariants(title).some(
      variant =>
        normalized ===
        String(variant)
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase()
    )
  ) {
    return true;
  }

  const textNorm = normalizeForCompare(raw);
  const titleNorm = normalizeForCompare(title);
  if (textNorm && titleNorm && textNorm === titleNorm) return true;

  const textTokens = textNorm.split(" ").filter(Boolean);
  const titleTokens = titleNorm.split(" ").filter(Boolean);
  if (textTokens.length && titleTokens.length) {
    const textSet = new Set(textTokens);
    const overlap = titleTokens.filter(token => textSet.has(token)).length;
    const reverse = textTokens.filter(token => titleTokens.includes(token))
      .length;
    const minTokenCount = Math.min(textTokens.length, titleTokens.length);
    if (
      overlap / titleTokens.length >= 0.5 &&
      reverse / textTokens.length >= 0.5 &&
      minTokenCount >= 1 &&
      (textNorm.length >= 6 || overlap >= 2)
    ) {
      return true;
    }
  }

  const headingText = raw
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const endsWithReport = /\breports?\s*$/i.test(headingText);
  const headingMarkup =
    /colspan\s*=/i.test(rawHtml) ||
    /text-align\s*:\s*center/i.test(rawHtml) ||
    /<(strong|b|h[1-6]|em)\b/i.test(rawHtml);
  const wordCount = raw.split(/\s+/).filter(Boolean).length;
  return (
    endsWithReport &&
    wordCount > 0 &&
    wordCount <= 12 &&
    (headingMarkup || isMostlyUpperCase(raw))
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

  result = result.replace(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi, (full, inner) => {
    if (countTextCells(inner) > 1) return full;
    return isTitleLikeText(stripTags(inner), title, full) ? "" : full;
  });

  result = result.replace(
    /<(h[1-6]|p)[^>]*>([\s\S]*?)<\/\1>/gi,
    (full, _tag, inner) =>
      isTitleLikeText(stripTags(inner), title, full) ? "" : full
  );

  result = result.replace(/<div\b[^>]*>([\s\S]*?)<\/div>/gi, (full, inner) => {
    if (/<(div|table|img)\b/i.test(inner)) return full;
    return isTitleLikeText(stripTags(inner), title, full) ? "" : full;
  });

  result = result.replace(
    /<table\b[^>]*>\s*(?:<(?:thead|tbody|tfoot)\b[^>]*>\s*<\/(?:thead|tbody|tfoot)>\s*)*<\/table>/gi,
    ""
  );

  return result;
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
