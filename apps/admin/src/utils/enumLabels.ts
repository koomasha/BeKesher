const ru: Record<string, string> = {
    // Statuses (shared across domains)
    Active: "Активный",
    Completed: "Завершён",
    Cancelled: "Отменён",
    Draft: "Черновик",
    Open: "Открыт",
    Answered: "Отвечен",
    Closed: "Закрыт",
    Pending: "Ожидает",
    Approved: "Одобрено",
    Revision: "На доработку",
    Rejected: "Отклонено",
    NotCompleted: "Не выполнено",
    Archive: "Архив",

    // Regions
    North: "Север",
    Center: "Центр",
    South: "Юг",

    // Gender
    Male: "Мужской",
    Female: "Женский",
    Other: "Другой",

    // Task type
    Activity: "Активность",
    Conversation: "Разговор",
    Creative: "Творчество",
    Philosophy: "Философия",

    // Task difficulty
    Easy: "Лёгкое",
    Medium: "Среднее",
    Hard: "Сложное",

    // Task purpose
    Everyone: "Для всех",
    Romantic: "Романтика",
    Friendship: "Дружба",
};

export function label(locale: string, value: string): string {
    if (locale === "ru") {
        return ru[value] ?? value;
    }
    return value;
}

export function weekLabel(locale: string, week: number | undefined): string {
    if (!week) return "-";
    if (locale === "ru") return `Неделя ${week}`;
    return `Week ${week}`;
}
