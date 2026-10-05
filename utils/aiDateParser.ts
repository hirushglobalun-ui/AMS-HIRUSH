/**
 * File: utils/aiDateParser.ts
 * Purpose: Smart natural language date parser for AI queries (supports English and Malayalam / Manglish).
 * Returns ISO format YYYY-MM-DD dates to match Firestore records.
 * Author: Hirush Global AMS
 */

export interface ParsedDateResult {
  date?: string; // YYYY-MM-DD
  startDate?: string;
  endDate?: string;
  label?: string;
  isRange?: boolean;
}

const DAYS_MAP: Record<string, number> = {
  nhaayar: 0,
  sunday: 0,
  sun: 0,
  thinkal: 1,
  thinkalaazhcha: 1,
  monday: 1,
  mon: 1,
  chovva: 2,
  chovvaazhcha: 2,
  tuesday: 2,
  tue: 2,
  budhan: 3,
  budhanaazhcha: 3,
  wednesday: 3,
  wed: 3,
  vyazham: 4,
  vyazhaazhcha: 4,
  thursday: 4,
  thu: 4,
  velli: 5,
  vellikizham: 5,
  vellikizhaacha: 5,
  velliyaazhcha: 5,
  friday: 5,
  fri: 5,
  shani: 6,
  shaniyaazhcha: 6,
  saturday: 6,
  sat: 6,
};

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export function formatToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse natural language date mentions from user queries.
 * Supports relative English, Manglish, and Malayalam date formats.
 */
export function extractDateFromQuery(query: string, referenceDate: Date = new Date()): ParsedDateResult {
  const lower = query.toLowerCase().trim();

  // 1. Direct ISO date format YYYY-MM-DD
  const isoMatch = lower.match(/\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    return { date: isoMatch[0], label: isoMatch[0], isRange: false };
  }

  // 2. Format DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = lower.match(/\b(0?[1-9]|[12]\d|3[01])[/-](0?[1-9]|1[0-2])[/-](20\d{2})\b/);
  if (dmyMatch) {
    const day = String(dmyMatch[1]).padStart(2, '0');
    const month = String(dmyMatch[2]).padStart(2, '0');
    const year = dmyMatch[3];
    return { date: `${year}-${month}-${day}`, label: `${day}/${month}/${year}`, isRange: false };
  }

  // 3. Tomorrow / Nale
  if (lower.includes('tomorrow') || lower.includes('nale')) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() + 1);
    const dStr = formatToYYYYMMDD(d);
    return { date: dStr, label: 'Tomorrow', isRange: false };
  }

  // 4. Yesterday / Innale / Kazhinja divasam
  if (lower.includes('yesterday') || lower.includes('innale') || lower.includes('kazhinja divasam')) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - 1);
    const dStr = formatToYYYYMMDD(d);
    return { date: dStr, label: 'Yesterday', isRange: false };
  }

  // 5. Past 7 days / Last 7 days
  if (lower.includes('past 7 days') || lower.includes('last 7 days') || lower.includes('7 days')) {
    const start = new Date(referenceDate);
    start.setDate(start.getDate() - 7);
    return {
      startDate: formatToYYYYMMDD(start),
      endDate: formatToYYYYMMDD(referenceDate),
      label: 'Past 7 Days',
      isRange: true,
    };
  }

  // 6. Past 30 days / Last 30 days
  if (lower.includes('past 30 days') || lower.includes('last 30 days') || lower.includes('30 days')) {
    const start = new Date(referenceDate);
    start.setDate(start.getDate() - 30);
    return {
      startDate: formatToYYYYMMDD(start),
      endDate: formatToYYYYMMDD(referenceDate),
      label: 'Past 30 Days',
      isRange: true,
    };
  }

  // 7. Last week / Kazhinja azhcha
  if (lower.includes('last week') || lower.includes('kazhinja azhcha') || lower.includes('kazhinja aazhcha')) {
    const currentDay = referenceDate.getDay();
    const prevMonday = new Date(referenceDate);
    prevMonday.setDate(referenceDate.getDate() - (currentDay === 0 ? 6 : currentDay - 1) - 7);
    const prevSunday = new Date(prevMonday);
    prevSunday.setDate(prevMonday.getDate() + 6);
    return {
      startDate: formatToYYYYMMDD(prevMonday),
      endDate: formatToYYYYMMDD(prevSunday),
      label: 'Last Week',
      isRange: true,
    };
  }

  // 8. This week / Ee azhcha
  if (lower.includes('this week') || lower.includes('ee azhcha') || lower.includes('ee aazhcha')) {
    const d = new Date(referenceDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      startDate: formatToYYYYMMDD(monday),
      endDate: formatToYYYYMMDD(sunday),
      label: 'This Week',
      isRange: true,
    };
  }

  // 9. Last month / Kazhinja masam
  if (lower.includes('last month') || lower.includes('kazhinja masam') || lower.includes('kazhinja maasam')) {
    const firstDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
    const lastDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0);
    return {
      startDate: formatToYYYYMMDD(firstDay),
      endDate: formatToYYYYMMDD(lastDay),
      label: 'Last Month',
      isRange: true,
    };
  }

  // 10. This month / Ee masam
  if (lower.includes('this month') || lower.includes('ee masam') || lower.includes('ee maasam')) {
    const firstDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    const lastDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
    return {
      startDate: formatToYYYYMMDD(firstDay),
      endDate: formatToYYYYMMDD(lastDay),
      label: 'This Month',
      isRange: true,
    };
  }

  // 11. Day of week detection (e.g. Friday, last Friday, Monday, etc.)
  for (const [dayKey, targetDayIndex] of Object.entries(DAYS_MAP)) {
    // Word boundary check to prevent false substring matches (e.g. "mon" in "month")
    const regex = new RegExp(`\\b${dayKey}\\b`, 'i');
    if (regex.test(lower)) {
      const currentDayIndex = referenceDate.getDay();
      let diff = currentDayIndex - targetDayIndex;

      const isExplicitLast =
        lower.includes('last') ||
        lower.includes('kazhinja') ||
        lower.includes('munnathe');

      const isExplicitThis =
        lower.includes('this') ||
        lower.includes('ee');

      if (isExplicitThis) {
        // e.g. "this Friday" in the current week
        diff = currentDayIndex - targetDayIndex;
      } else if (diff <= 0) {
        diff += 7; // Previous occurrence
      } else if (isExplicitLast && diff < 7) {
        diff += 7;
      }

      const targetDate = new Date(referenceDate);
      targetDate.setDate(targetDate.getDate() - diff);
      const dStr = formatToYYYYMMDD(targetDate);
      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });

      return {
        date: dStr,
        label: `${isExplicitLast ? 'Last ' : ''}${dayName} (${dStr})`,
        isRange: false,
      };
    }
  }

  // 12. Today / Innu (Malayalam) or default fallback
  return {
    date: formatToYYYYMMDD(referenceDate),
    label: 'Today',
    isRange: false,
  };
}
