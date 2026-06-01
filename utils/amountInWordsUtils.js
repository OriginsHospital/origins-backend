const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen"
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety"
];

function wordsBelow100(n) {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones ? `${TENS[tens]} ${ONES[ones]}` : TENS[tens];
}

function wordsBelow1000(n) {
  if (n < 100) return wordsBelow100(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return rest
    ? `${ONES[hundreds]} Hundred ${wordsBelow100(rest)}`
    : `${ONES[hundreds]} Hundred`;
}

/** Words for crore / lakh / thousand multipliers (1–999). */
function segmentWords(n) {
  if (n < 100) return wordsBelow100(n);
  return wordsBelow1000(n);
}

/**
 * Indian numbering: crore → lakh → thousand → hundreds (e.g. 1,75,000).
 */
function integerToIndianWords(n) {
  const amount = Math.floor(n);
  if (amount === 0) return "Zero";

  const parts = [];
  let remainder = amount;

  const crore = Math.floor(remainder / 10000000);
  remainder %= 10000000;
  const lakh = Math.floor(remainder / 100000);
  remainder %= 100000;
  const thousand = Math.floor(remainder / 1000);
  remainder %= 1000;

  if (crore) parts.push(`${segmentWords(crore)} Crore`);
  if (lakh) parts.push(`${segmentWords(lakh)} Lakh`);
  if (thousand) parts.push(`${segmentWords(thousand)} Thousand`);
  if (remainder) parts.push(wordsBelow1000(remainder));

  return parts.join(" ");
}

/**
 * Invoice amount in words (Indian system) with optional paise.
 * @param {number|string} amount
 * @returns {string} e.g. "One Lakh Seventy Five Thousand Rupees"
 */
function formatAmountInWords(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || num < 0) {
    return "Zero Rupees";
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  const rupeeWords = integerToIndianWords(rupees);
  if (paise > 0) {
    return `${rupeeWords} Rupees and ${integerToIndianWords(paise)} Paise`;
  }

  return `${rupeeWords} Rupees`;
}

module.exports = {
  formatAmountInWords,
  integerToIndianWords
};
