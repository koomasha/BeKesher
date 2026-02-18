/**
 * Calculate age from birth date string.
 * @param birthDate - Date string in format "YYYY-MM-DD"
 * @returns Age in years
 */
export function calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

/**
 * Calculate the Sunday 8:00 AM Israel time reveal timestamp
 * after a group is created (on Saturday).
 * Israel timezone: Asia/Jerusalem (UTC+2 standard, UTC+3 DST)
 * Uses fixed UTC+2 offset (IST) — during summer the reveal is at 9:00 AM IDT.
 */
export function getSundayRevealTimeIsrael(groupCreatedAt: number): number {
    const groupDate = new Date(groupCreatedAt);
    const dayOfWeek = groupDate.getUTCDay(); // 0=Sun, 6=Sat

    // Calculate days until next Sunday
    const daysUntilSunday = dayOfWeek === 6 ? 1 : (7 - dayOfWeek) % 7 || 7;

    const nextSunday = new Date(groupDate);
    nextSunday.setUTCDate(groupDate.getUTCDate() + daysUntilSunday);
    nextSunday.setUTCHours(6, 0, 0, 0); // 06:00 UTC = 08:00 Israel Standard Time

    return nextSunday.getTime();
}

/**
 * Calculate which week in season (1-4) based on timestamps.
 * Pure function - no database access needed.
 * @returns Week number 1-4, or null if outside season bounds
 */
export function calculateWeekInSeason(
    seasonStartDate: number,
    currentTimestamp: number
): number | null {
    const elapsed = currentTimestamp - seasonStartDate;
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const weekNumber = Math.floor(elapsed / weekMs) + 1;

    if (weekNumber < 1 || weekNumber > 4) {
        return null;
    }

    return weekNumber;
}
