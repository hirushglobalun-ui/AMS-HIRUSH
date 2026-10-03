/**
 * File: utils/aiDateParser.ts
 * Purpose: Smart natural language date parser for AI queries (supports English and Malayalam / Manglish).
 * Returns ISO format YYYY-MM-DD dates to match Firestore records.
 */

export interface ParsedDateResult {
  date?: string; // YYYY-MM-DD
  startDate?: string;
  endDate?: string;
  label?: string;
}

const MALAYALAM_DAYS: Record<string, number> = {
  nhaayar: 0,
  sunday: 0,
  thinkal: 1,
  monday: 1,
  chovva: 2,
  tuesday: 2,
  budhan: 3,
  wednesday: 3,
  vyazham: 4,
  thursday: 4,
  velli: 5,
  vellikizhaacha: 5,
  friday: 5,
  shani: 6,
  saturday: 6,
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
 * Parse natural language date mentions from user queries
 * Handles today, yesterday, Friday, last Friday, specific dates, Malayalam day names
 */
export function extractDateFromQuery(query: string, referenceDate: Date = new Date()): ParsedDateResult {
  const lower = query.toLowerCase().trim();

  // 1. Direct ISO date format YYYY-MM-DD
  const isoMatch = lower.match(/\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    return { date: isoMatch[0], label: isoMatch[0] };
  }

  // 2. Format DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = lower.match(/\b(0?[1-9]|[12]\d|3[01])[\/-](0?[1-9]|1[0-2])[\/-](20\d{2})\b/);
  if (dmyMatch) {
    const day = String(dmyMatch[1]).padStart(2, '0');
    const month = String(dmyMatch[2]).padStart(2, '0');
    const year = dmyMatch[3];
    return { date: `${year}-${month}-${day}`, label: `${day}/${month}/${year}` };
  }

  // 3. Today / Innu (Malayalam)
  if (lower.includes('today') || lower.includes('innu')) {
    const dStr = formatToYYYYMMDD(referenceDate);
    return { date: dStr, label: 'Today' };
  }

  // 4. Yesterday / Innale (Malayalam)
  if (lower.includes('yesterday') || lower.includes('innale')) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - 1);
    const dStr = formatToYYYYMMDD(d);
    return { date: dStr, label: 'Yesterday' };
  }

  // 5. Day of week detection (e.g. Friday, last Friday, vellikizhaacha)
  for (const [dayKey, targetDayIndex] of Object.entries(MALAYALAM_DAYS)) {
    if (lower.includes(dayKey)) {
      const currentDayIndex = referenceDate.getDay();
      let diff = currentDayIndex - targetDayIndex;
      
      // If asking "last friday" or if today is Friday and asking about Friday
      const isExplicitLast = lower.includes('last') || lower.includes('kazhinja') || lower.includes('munnathe');
      
      if (diff <= 0) {
        diff += 7; // Go back to the previous occurrence
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
      };
    }
  }

  // 6. This week / Ee aazhcha
  if (lower.includes('this week') || lower.includes('ee aazhcha')) {
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
    };
  }

  // 7. This month / Ee maasam
  if (lower.includes('this month') || lower.includes('ee maasam')) {
    const firstDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    const lastDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
    return {
      startDate: formatToYYYYMMDD(firstDay),
      endDate: formatToYYYYMMDD(lastDay),
      label: 'This Month',
    };
  }

  // Default: if no specific date was mentioned, reference today
  return {
    date: formatToYYYYMMDD(referenceDate),
    label: 'Today',
  };
}
