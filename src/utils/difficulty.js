// Determines how many pairs the memory match challenge requires,
// based on day-of-week base difficulty and snooze penalty.

const DAY_BASE_PAIRS = {
  0: 4, // Sunday - easier
  1: 6, // Monday
  2: 6, // Tuesday
  3: 6, // Wednesday
  4: 6, // Thursday
  5: 8, // Friday - harder
  6: 4, // Saturday - easier
};

const MAX_PAIRS = 12;
const SNOOZE_PENALTY_PAIRS = 4;

export function getPairsRequired({ date = new Date(), snoozeCount = 0 } = {}) {
  const base = DAY_BASE_PAIRS[date.getDay()] ?? 6;
  const withPenalty = base + snoozeCount * SNOOZE_PENALTY_PAIRS;
  return Math.min(withPenalty, MAX_PAIRS);
}

export function getRating(flips, pairsRequired) {
  const perfect = pairsRequired * 2; // theoretical minimum flips
  const ratio = flips / perfect;
  if (ratio <= 1.3) return 'S';
  if (ratio <= 1.8) return 'A';
  if (ratio <= 2.5) return 'B';
  return 'C';
}
