import dayjs from 'dayjs';

// Nepali month names (correct official spellings)
const nepaliMonths = [
  'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'असोज',
  'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत्र',
];

// English names for BS months
const bsMonthNamesEn = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

// Nepali digits
const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

function toNepaliDigits(num) {
  return String(num)
    .split('')
    .map(d => (d >= '0' && d <= '9' ? nepaliDigits[parseInt(d)] : d))
    .join('');
}

/**
 * Days per month for each BS year.
 * Each array has 12 entries (Baisakh → Chaitra).
 */
const BS_DAYS = {
  2078: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2079: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 32, 31, 31, 32, 30, 30, 29, 30, 29, 30, 29],
  2084: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2086: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2087: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2088: [30, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2089: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2090: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
};

function getDaysInBsMonth(bsYear, bsMonth) {
  const months = BS_DAYS[bsYear];
  if (months) return months[bsMonth];
  // Fallback: use nearest known year
  const knownYears = Object.keys(BS_DAYS).map(Number).sort((a, b) => a - b);
  const nearest = knownYears.reduce((prev, curr) =>
    Math.abs(curr - bsYear) < Math.abs(prev - bsYear) ? curr : prev
  );
  return BS_DAYS[nearest][bsMonth];
}

/**
 * Reference anchor: 2081 Baisakh 1 = April 13, 2024 (AD)
 * Verified against official Nepal calendar.
 */
const EPOCH_BS  = { year: 2081, month: 0, day: 1 }; // month 0 = Baisakh
const EPOCH_AD  = '2024-04-13';

function adToBs(adDate) {
  const date    = dayjs(adDate);
  const epoch   = dayjs(EPOCH_AD);
  let daysDiff  = date.diff(epoch, 'day');

  let { year: bsYear, month: bsMonth, day: bsDay } = { ...EPOCH_BS };

  if (daysDiff >= 0) {
    bsDay += daysDiff;
    while (true) {
      const dim = getDaysInBsMonth(bsYear, bsMonth);
      if (bsDay <= dim) break;
      bsDay -= dim;
      bsMonth++;
      if (bsMonth >= 12) {
        bsMonth = 0;
        bsYear++;
      }
    }
  } else {
    daysDiff = -daysDiff;
    bsDay -= daysDiff;
    while (bsDay <= 0) {
      bsMonth--;
      if (bsMonth < 0) {
        bsMonth = 11;
        bsYear--;
      }
      bsDay += getDaysInBsMonth(bsYear, bsMonth);
    }
  }

  return { bsYear, bsMonth, bsDay };
}

/**
 * Format an AD date string or Date object into Nepali date info.
 * Returns empty strings gracefully for null/undefined input.
 */
export function formatNepaliDate(date) {
  if (!date) return { bs: '', ad: '', bsShort: '', bsMonthName: '', bsMonthNameEn: '', bsYear: 0, bsMonth: 0, bsDay: 0 };

  try {
    const adDate = dayjs(date);
    if (!adDate.isValid()) return { bs: '', ad: '', bsShort: '', bsMonthName: '', bsMonthNameEn: '', bsYear: 0, bsMonth: 0, bsDay: 0 };

    const { bsYear, bsMonth, bsDay } = adToBs(adDate);

    const bs = `${toNepaliDigits(bsYear)} ${nepaliMonths[bsMonth]} ${toNepaliDigits(bsDay)}`;
    const ad = adDate.format('MMM D, YYYY');

    return {
      bs,
      ad,
      bsShort:       `${toNepaliDigits(bsYear)} ${nepaliMonths[bsMonth].substring(0, 3)} ${toNepaliDigits(bsDay)}`,
      bsMonthName:   nepaliMonths[bsMonth],
      bsMonthNameEn: bsMonthNamesEn[bsMonth],
      bsYear,
      bsMonth:       bsMonth + 1, // 1-indexed for callers
      bsDay,
    };
  } catch {
    // If conversion fails, fall back to AD only
    try {
      const adDate = dayjs(date);
      return { bs: '', ad: adDate.isValid() ? adDate.format('MMM D, YYYY') : '', bsShort: '', bsMonthName: '', bsMonthNameEn: '', bsYear: 0, bsMonth: 0, bsDay: 0 };
    } catch {
      return { bs: '', ad: '', bsShort: '', bsMonthName: '', bsMonthNameEn: '', bsYear: 0, bsMonth: 0, bsDay: 0 };
    }
  }
}

export function formatNepaliDateShort(date) {
  if (!date) return '';
  const { bs, ad } = formatNepaliDate(date);
  if (!bs) return ad || '';
  return `${bs} (${dayjs(date).format('MMM D')})`;
}

export function getTodayBs() {
  return formatNepaliDate(new Date());
}
