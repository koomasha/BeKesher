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
