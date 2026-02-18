import { internalMutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Region, Gender } from "./validators";

// ============================================
// HELPERS
// ============================================

const ALL_TABLES = [
    "taskAssignments",
    "seasonParticipants",
    "feedback",
    "paymentLogs",
    "supportTickets",
    "groups",
    "participantChangeLogs",
    "sessions",
    "tasks",
    "seasons",
    "participants",
] as const;

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

function assertNotProduction() {
    if (process.env.ENVIRONMENT === "production") {
        throw new Error("Destructive seed operations are blocked in production. Remove the ENVIRONMENT=production env var to proceed.");
    }
}

async function deleteAllTables(ctx: any) {
    for (const table of ALL_TABLES) {
        const docs = await ctx.db.query(table).collect();
        for (const doc of docs) {
            await ctx.db.delete(doc._id);
        }
        if (docs.length > 0) {
            console.log(`  Deleted ${docs.length} rows from ${table}`);
        }
    }
}

// ============================================
// CLEAN ALL TABLES
// ============================================

export const cleanAll = internalMutation({
    args: {},
    handler: async (ctx) => {
        // assertNotProduction(); // temporarily disabled for admin panel testing
        console.log("🧹 Cleaning all tables...");
        await deleteAllTables(ctx);
        console.log("🧹 All tables cleaned.");
    },
});

// ============================================
// RESET AND SEED
// ============================================

export const resetAndSeed = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();

        // ---- 1. Clean ----
        // assertNotProduction(); // temporarily disabled for admin panel testing
        console.log("🧹 Cleaning...");
        await deleteAllTables(ctx);

        // ---- 2. Participants (20 total) ----
        console.log("👤 Seeding participants...");

        interface ParticipantDef {
            name: string;
            phone: string;
            telegramId: string;
            tgFirstName: string;
            tgLastName: string;
            birthDate: string;
            gender: Gender;
            region: Region;
            city: string;
            status: "Active" | "Lead" | "Inactive";
            onPause: boolean;
            totalPoints: number;
            profession: string;
            aboutMe: string;
        }

        const participantDefs: ParticipantDef[] = [
            // --- 15 Active (5 per region) ---
            // Center
            { name: "Анна Левина", phone: "+972501000001", telegramId: "tg_1001", tgFirstName: "Анна", tgLastName: "Левина", birthDate: "1995-03-15", gender: "Female", region: "Center", city: "Тель-Авив", status: "Active", onPause: false, totalPoints: 30, profession: "Дизайнер", aboutMe: "Люблю искусство и путешествия" },
            { name: "Михаил Коган", phone: "+972501000002", telegramId: "tg_1002", tgFirstName: "Михаил", tgLastName: "Коган", birthDate: "1990-07-22", gender: "Male", region: "Center", city: "Тель-Авив", status: "Active", onPause: false, totalPoints: 45, profession: "Программист", aboutMe: "Увлекаюсь бегом и кулинарией" },
            { name: "Елена Штерн", phone: "+972501000003", telegramId: "tg_1003", tgFirstName: "Елена", tgLastName: "Штерн", birthDate: "1988-11-30", gender: "Female", region: "Center", city: "Ришон ле-Цион", status: "Active", onPause: false, totalPoints: 20, profession: "Маркетолог", aboutMe: "Ищу новых друзей и впечатления" },
            { name: "Давид Перец", phone: "+972501000004", telegramId: "tg_1004", tgFirstName: "Давид", tgLastName: "Перец", birthDate: "1992-01-10", gender: "Male", region: "Center", city: "Петах-Тиква", status: "Active", onPause: false, totalPoints: 15, profession: "Инженер", aboutMe: "Переехал год назад, хочу завести друзей" },
            { name: "Мария Волкова", phone: "+972501000005", telegramId: "tg_1005", tgFirstName: "Мария", tgLastName: "Волкова", birthDate: "1997-06-05", gender: "Female", region: "Center", city: "Тель-Авив", status: "Active", onPause: true, totalPoints: 10, profession: "Учитель", aboutMe: "На паузе — в отпуске" },
            // North
            { name: "Игорь Бенсон", phone: "+972501000006", telegramId: "tg_1006", tgFirstName: "Игорь", tgLastName: "Бенсон", birthDate: "1985-09-18", gender: "Male", region: "North", city: "Хайфа", status: "Active", onPause: false, totalPoints: 55, profession: "Врач", aboutMe: "Люблю горы и море" },
            { name: "Ольга Розен", phone: "+972501000007", telegramId: "tg_1007", tgFirstName: "Ольга", tgLastName: "Розен", birthDate: "1993-04-12", gender: "Female", region: "North", city: "Хайфа", status: "Active", onPause: false, totalPoints: 25, profession: "Юрист", aboutMe: "Хочу расширить круг общения" },
            { name: "Алексей Гринберг", phone: "+972501000008", telegramId: "tg_1008", tgFirstName: "Алексей", tgLastName: "Гринберг", birthDate: "1991-12-01", gender: "Male", region: "North", city: "Нацерет-Илит", status: "Active", onPause: false, totalPoints: 35, profession: "Архитектор", aboutMe: "Рисую и строю" },
            { name: "Наталья Кац", phone: "+972501000009", telegramId: "tg_1009", tgFirstName: "Наталья", tgLastName: "Кац", birthDate: "1996-08-25", gender: "Female", region: "North", city: "Тверия", status: "Active", onPause: false, totalPoints: 5, profession: "Фотограф", aboutMe: "Снимаю природу Израиля" },
            { name: "Виктор Либерман", phone: "+972501000010", telegramId: "tg_1010", tgFirstName: "Виктор", tgLastName: "Либерман", birthDate: "1987-02-14", gender: "Male", region: "North", city: "Хайфа", status: "Active", onPause: false, totalPoints: 40, profession: "Повар", aboutMe: "Готовлю и угощаю" },
            // South
            { name: "Светлана Фридман", phone: "+972501000011", telegramId: "tg_1011", tgFirstName: "Светлана", tgLastName: "Фридман", birthDate: "1994-05-20", gender: "Female", region: "South", city: "Беэр-Шева", status: "Active", onPause: false, totalPoints: 50, profession: "Психолог", aboutMe: "Помогаю людям и себе" },
            { name: "Роман Авербух", phone: "+972501000012", telegramId: "tg_1012", tgFirstName: "Роман", tgLastName: "Авербух", birthDate: "1989-10-08", gender: "Male", region: "South", city: "Ашдод", status: "Active", onPause: false, totalPoints: 20, profession: "Менеджер", aboutMe: "Люблю спорт и настолки" },
            { name: "Татьяна Зильбер", phone: "+972501000013", telegramId: "tg_1013", tgFirstName: "Татьяна", tgLastName: "Зильбер", birthDate: "1998-01-30", gender: "Female", region: "South", city: "Ашкелон", status: "Active", onPause: false, totalPoints: 0, profession: "Студент", aboutMe: "Учусь и знакомлюсь" },
            { name: "Сергей Дорон", phone: "+972501000014", telegramId: "tg_1014", tgFirstName: "Сергей", tgLastName: "Дорон", birthDate: "1986-07-03", gender: "Male", region: "South", city: "Беэр-Шева", status: "Active", onPause: false, totalPoints: 30, profession: "Электрик", aboutMe: "Ищу компанию для походов" },
            { name: "Юлия Шапиро", phone: "+972501000015", telegramId: "tg_1015", tgFirstName: "Юлия", tgLastName: "Шапиро", birthDate: "1992-11-17", gender: "Female", region: "South", city: "Ашдод", status: "Active", onPause: false, totalPoints: 15, profession: "Бухгалтер", aboutMe: "Новая в городе, хочу познакомиться" },
            // --- 3 Lead ---
            { name: "Дмитрий Нович", phone: "+972501000016", telegramId: "tg_1016", tgFirstName: "Дмитрий", tgLastName: "Нович", birthDate: "1999-03-11", gender: "Male", region: "Center", city: "Тель-Авив", status: "Lead", onPause: false, totalPoints: 0, profession: "Студент", aboutMe: "" },
            { name: "Кристина Леви", phone: "+972501000017", telegramId: "tg_1017", tgFirstName: "Кристина", tgLastName: "Леви", birthDate: "1995-09-27", gender: "Female", region: "North", city: "Хайфа", status: "Lead", onPause: false, totalPoints: 0, profession: "", aboutMe: "" },
            { name: "Артём Барак", phone: "+972501000018", telegramId: "tg_1018", tgFirstName: "Артём", tgLastName: "Барак", birthDate: "2000-12-05", gender: "Male", region: "South", city: "Ашдод", status: "Lead", onPause: false, totalPoints: 0, profession: "", aboutMe: "" },
            // --- 2 Inactive ---
            { name: "Ирина Голан", phone: "+972501000019", telegramId: "tg_1019", tgFirstName: "Ирина", tgLastName: "Голан", birthDate: "1983-04-14", gender: "Female", region: "Center", city: "Тель-Авив", status: "Inactive", onPause: false, totalPoints: 60, profession: "Дизайнер", aboutMe: "Вернусь позже" },
            { name: "Павел Шор", phone: "+972501000020", telegramId: "tg_1020", tgFirstName: "Павел", tgLastName: "Шор", birthDate: "1980-08-22", gender: "Male", region: "North", city: "Хайфа", status: "Inactive", onPause: false, totalPoints: 70, profession: "Инженер", aboutMe: "Был активным участником" },
        ];

        const pIds: string[] = [];
        for (let i = 0; i < participantDefs.length; i++) {
            const p = participantDefs[i];
            const id = await ctx.db.insert("participants", {
                name: p.name,
                phone: p.phone,
                telegramId: p.telegramId,
                tgFirstName: p.tgFirstName,
                tgLastName: p.tgLastName,
                birthDate: p.birthDate,
                gender: p.gender,
                region: p.region,
                city: p.city,
                status: p.status,
                onPause: p.onPause,
                totalPoints: p.totalPoints,
                registrationDate: now - 30 * DAY + i * DAY, // staggered registration
                periodsPaid: p.status === "Active" ? 1 : 0,
                socialMediaConsent: true,
                profession: p.profession || undefined,
                aboutMe: p.aboutMe || undefined,
            });
            pIds.push(id);
        }

        // Handy aliases (index matches participantDefs order, 0-based)
        const p = (index: number) => pIds[index] as any; // typed as Id<"participants"> at runtime

        // ---- 3. Season ----
        console.log("📅 Seeding season...");

        // Start date = 2 Saturdays ago at 16:00 UTC (18:00 Israel)
        // This puts us in week 2 per calculateWeekInSeason
        const seasonStart = now - 8 * DAY;
        const seasonEnd = seasonStart + 4 * WEEK;

        const seasonId = await ctx.db.insert("seasons", {
            name: "Зимний сезон 2026",
            description: "Первый сезон BeKesher — зима 2026",
            startDate: seasonStart,
            endDate: seasonEnd,
            status: "Active",
            createdAt: seasonStart - 7 * DAY,
            createdByEmail: "masha@koomasha.com",
        });

        // Also create a completed season for history
        const oldSeasonId = await ctx.db.insert("seasons", {
            name: "Пробный сезон",
            description: "Тестовый запуск",
            startDate: seasonStart - 5 * WEEK,
            endDate: seasonStart - WEEK,
            status: "Completed",
            createdAt: seasonStart - 6 * WEEK,
            createdByEmail: "masha@koomasha.com",
        });

        // Draft season for admin testing
        await ctx.db.insert("seasons", {
            name: "Весенний сезон 2026",
            description: "Запланированный весенний сезон",
            startDate: seasonEnd + WEEK,
            endDate: seasonEnd + 5 * WEEK,
            status: "Draft",
            createdAt: now - DAY,
            createdByEmail: "masha@koomasha.com",
        });

        // ---- 4. Season enrollments ----
        console.log("📋 Seeding season enrollments...");

        // Enroll all 15 Active participants (indexes 0-14)
        for (let i = 0; i < 15; i++) {
            await ctx.db.insert("seasonParticipants", {
                seasonId,
                participantId: p(i),
                enrolledAt: seasonStart - 2 * DAY + i * 1000,
                // Mария Волкова (index 4) is on pause
                status: i === 4 ? "Paused" : "Enrolled",
            });
        }

        // Old season: a few completed enrollments
        for (let i = 0; i < 6; i++) {
            await ctx.db.insert("seasonParticipants", {
                seasonId: oldSeasonId,
                participantId: p(i),
                enrolledAt: seasonStart - 5 * WEEK,
                status: "Completed",
            });
        }

        // ---- 5. Tasks ----
        console.log("📝 Seeding tasks...");

        const task1 = await ctx.db.insert("tasks", {
            title: "Совместная прогулка",
            description: "Прогуляйтесь вместе по набережной или парку в вашем городе. Познакомьтесь поближе!",
            reportInstructions: "Опишите, где вы гуляли и что обсуждали. Приложите совместное фото.",
            onlineInstructions: "Если нет возможности встретиться лично — прогуляйтесь онлайн по Google Maps вместе.",
            type: "Activity",
            difficulty: "Easy",
            purpose: "Everyone",
            status: "Active",
            createdAt: seasonStart - 3 * DAY,
            createdByEmail: "masha@koomasha.com",
        });

        const task2 = await ctx.db.insert("tasks", {
            title: "Разговор о мечтах",
            description: "Поделитесь друг с другом своими мечтами и планами на будущее в Израиле.",
            reportInstructions: "Расскажите коротко об одной мечте каждого участника группы.",
            type: "Conversation",
            difficulty: "Medium",
            purpose: "Everyone",
            status: "Active",
            createdAt: seasonStart - 3 * DAY,
            createdByEmail: "masha@koomasha.com",
        });

        const task3 = await ctx.db.insert("tasks", {
            title: "Творческий коллаж",
            description: "Создайте вместе коллаж из фотографий, рисунков или вырезок, который отражает вашу группу.",
            reportInstructions: "Приложите фото коллажа и расскажите, почему выбрали именно такие элементы.",
            type: "Creative",
            difficulty: "Hard",
            purpose: "Friendship",
            status: "Active",
            createdAt: seasonStart - 3 * DAY,
            createdByEmail: "masha@koomasha.com",
        });

        const task4 = await ctx.db.insert("tasks", {
            title: "Вопрос дня",
            description: "Обсудите вопрос: «Что для вас значит дом?» Каждый делится своим ответом.",
            reportInstructions: "Запишите по одному предложению от каждого участника.",
            type: "Philosophy",
            difficulty: "Medium",
            purpose: "Everyone",
            status: "Active",
            createdAt: seasonStart - 3 * DAY,
            createdByEmail: "masha@koomasha.com",
        });

        // Archive task for admin testing
        await ctx.db.insert("tasks", {
            title: "Старое задание (архив)",
            description: "Это задание из прошлого сезона.",
            reportInstructions: "Неактуально",
            type: "Activity",
            difficulty: "Easy",
            purpose: "Everyone",
            status: "Archive",
            createdAt: seasonStart - 6 * WEEK,
            createdByEmail: "masha@koomasha.com",
        });

        // ---- 6. Week 1 groups (Completed) ----
        console.log("👥 Seeding week 1 groups (completed)...");

        const week1Time = seasonStart + 1000; // just after season start

        // Group A — Center, 3 members, task Approved (with photos)
        const groupA = await ctx.db.insert("groups", {
            participant1: p(0), // Анна
            participant2: p(1), // Михаил
            participant3: p(2), // Елена
            region: "Center",
            status: "Completed",
            createdAt: week1Time,
            seasonId,
            weekInSeason: 1,
            taskId: task1,
        });

        // Group B — North, 2 members, task Approved (text only)
        const groupB = await ctx.db.insert("groups", {
            participant1: p(5), // Игорь
            participant2: p(6), // Ольга
            region: "North",
            status: "Completed",
            createdAt: week1Time,
            seasonId,
            weekInSeason: 1,
            taskId: task2,
        });

        // Group C — South, 3 members, task Rejected
        const groupC = await ctx.db.insert("groups", {
            participant1: p(10), // Светлана
            participant2: p(11), // Роман
            participant3: p(12), // Татьяна
            region: "South",
            status: "Completed",
            createdAt: week1Time,
            seasonId,
            weekInSeason: 1,
            taskId: task3,
        });

        // Group D — Center, 2 members, task NotCompleted
        const groupD = await ctx.db.insert("groups", {
            participant1: p(3), // Давид
            participant2: p(7), // Алексей
            region: "Center",
            status: "Completed",
            createdAt: week1Time,
            seasonId,
            weekInSeason: 1,
            taskId: task4,
        });

        // ---- 7. Task assignments for week 1 ----
        console.log("📌 Seeding week 1 task assignments...");

        // Group A — Approved with photos
        await ctx.db.insert("taskAssignments", {
            groupId: groupA,
            taskId: task1,
            weekInSeason: 1,
            seasonId,
            assignedAt: week1Time + 60000,
            assignedByEmail: "masha@koomasha.com",
            completedAt: week1Time + 3 * DAY,
            completionNotes: "Гуляли по набережной Тель-Авива, обсуждали жизнь в Израиле. Было здорово!",
            submittedBy: p(0),
            submittedAt: week1Time + 3 * DAY,
            reviewStatus: "Approved",
            reviewedAt: week1Time + 4 * DAY,
            reviewedByEmail: "masha@koomasha.com",
            reviewComment: "Отличный отчёт! Молодцы!",
            pointsAwarded: 10,
        });

        // Group B — Approved text only
        await ctx.db.insert("taskAssignments", {
            groupId: groupB,
            taskId: task2,
            weekInSeason: 1,
            seasonId,
            assignedAt: week1Time + 60000,
            assignedByEmail: "masha@koomasha.com",
            completedAt: week1Time + 4 * DAY,
            completionNotes: "Игорь мечтает открыть ресторан, Ольга — основать юридическую фирму.",
            submittedBy: p(5),
            submittedAt: week1Time + 4 * DAY,
            reviewStatus: "Approved",
            reviewedAt: week1Time + 5 * DAY,
            reviewedByEmail: "masha@koomasha.com",
            pointsAwarded: 5,
        });

        // Group C — Rejected
        await ctx.db.insert("taskAssignments", {
            groupId: groupC,
            taskId: task3,
            weekInSeason: 1,
            seasonId,
            assignedAt: week1Time + 60000,
            assignedByEmail: "masha@koomasha.com",
            completedAt: week1Time + 5 * DAY,
            completionNotes: "Сделали коллаж",
            submittedBy: p(10),
            submittedAt: week1Time + 5 * DAY,
            reviewStatus: "Rejected",
            reviewedAt: week1Time + 6 * DAY,
            reviewedByEmail: "masha@koomasha.com",
            reviewComment: "Отчёт слишком короткий. Добавьте описание элементов коллажа.",
            pointsAwarded: 0,
        });

        // Group D — NotCompleted
        await ctx.db.insert("taskAssignments", {
            groupId: groupD,
            taskId: task4,
            weekInSeason: 1,
            seasonId,
            assignedAt: week1Time + 60000,
            assignedByEmail: "masha@koomasha.com",
            reviewStatus: "NotCompleted",
            pointsAwarded: 0,
            notCompletedReason: "Участники не смогли встретиться на этой неделе",
        });

        // ---- 8. Week 2 groups (Active) ----
        console.log("👥 Seeding week 2 groups (active)...");

        const week2Time = now - DAY; // yesterday

        // Group E — Center, 3 members, task assigned, Pending
        const groupE = await ctx.db.insert("groups", {
            participant1: p(0), // Анна
            participant2: p(3), // Давид
            participant3: p(2), // Елена
            region: "Center",
            status: "Active",
            createdAt: week2Time,
            seasonId,
            weekInSeason: 2,
            taskId: task2,
        });

        // Group F — North, 2 members, task assigned, Pending (report submitted)
        const groupF = await ctx.db.insert("groups", {
            participant1: p(5), // Игорь
            participant2: p(7), // Алексей
            region: "North",
            status: "Active",
            createdAt: week2Time,
            seasonId,
            weekInSeason: 2,
            taskId: task1,
        });

        // Group G — South, 3 members, NO task assigned
        await ctx.db.insert("groups", {
            participant1: p(10), // Светлана
            participant2: p(13), // Сергей
            participant3: p(14), // Юлия
            region: "South",
            status: "Active",
            createdAt: week2Time,
            seasonId,
            weekInSeason: 2,
        });

        // Group H — Center, 2 members, task assigned, Revision
        const groupH = await ctx.db.insert("groups", {
            participant1: p(1), // Михаил
            participant2: p(8), // Наталья
            region: "Center",
            status: "Active",
            createdAt: week2Time,
            seasonId,
            weekInSeason: 2,
            taskId: task4,
        });

        // ---- 9. Task assignments for week 2 ----
        console.log("📌 Seeding week 2 task assignments...");

        // Group E — Pending (no submission yet)
        await ctx.db.insert("taskAssignments", {
            groupId: groupE,
            taskId: task2,
            weekInSeason: 2,
            seasonId,
            assignedAt: week2Time + 60000,
            assignedByEmail: "masha@koomasha.com",
            reviewStatus: "Pending",
            pointsAwarded: 0,
        });

        // Group F — Pending (report submitted, awaiting review)
        await ctx.db.insert("taskAssignments", {
            groupId: groupF,
            taskId: task1,
            weekInSeason: 2,
            seasonId,
            assignedAt: week2Time + 60000,
            assignedByEmail: "masha@koomasha.com",
            completedAt: now - 6 * 60 * 60 * 1000, // 6 hours ago
            completionNotes: "Прогулялись по Бахайским садам в Хайфе. Обменялись историями переезда.",
            submittedBy: p(5),
            submittedAt: now - 6 * 60 * 60 * 1000,
            reviewStatus: "Pending",
            pointsAwarded: 0,
        });

        // Group H — Revision
        await ctx.db.insert("taskAssignments", {
            groupId: groupH,
            taskId: task4,
            weekInSeason: 2,
            seasonId,
            assignedAt: week2Time + 60000,
            assignedByEmail: "masha@koomasha.com",
            completedAt: now - 12 * 60 * 60 * 1000,
            completionNotes: "Обсудили тему дома.",
            submittedBy: p(1),
            submittedAt: now - 12 * 60 * 60 * 1000,
            reviewStatus: "Revision",
            reviewedAt: now - 4 * 60 * 60 * 1000,
            reviewedByEmail: "masha@koomasha.com",
            reviewComment: "Пожалуйста, добавьте ответ каждого участника отдельно.",
            pointsAwarded: 0,
        });

        // ---- 10. Feedback (from week 1) ----
        console.log("⭐ Seeding feedback...");

        await ctx.db.insert("feedback", {
            groupId: groupA,
            participantId: p(0),
            rating: 5,
            textFeedback: "Отличная встреча! Михаил очень интересный собеседник.",
            wouldMeetAgain: "yes",
            submittedAt: week1Time + 5 * DAY,
        });

        await ctx.db.insert("feedback", {
            groupId: groupA,
            participantId: p(1),
            rating: 4,
            textFeedback: "Было хорошо, но хотелось бы больше времени.",
            wouldMeetAgain: "yes",
            submittedAt: week1Time + 5 * DAY,
        });

        await ctx.db.insert("feedback", {
            groupId: groupB,
            participantId: p(5),
            rating: 5,
            textFeedback: "Ольга замечательная! Планируем встретиться ещё.",
            wouldMeetAgain: "yes",
            submittedAt: week1Time + 6 * DAY,
        });

        await ctx.db.insert("feedback", {
            groupId: groupC,
            participantId: p(11),
            rating: 3,
            textFeedback: "Нормально, но задание было сложноватым.",
            wouldMeetAgain: "maybe",
            submittedAt: week1Time + 6 * DAY,
        });

        // ---- 11. Payment logs ----
        console.log("💳 Seeding payment logs...");

        await ctx.db.insert("paymentLogs", {
            participantId: p(0),
            amount: 50,
            currency: "ILS",
            status: "Success",
            payPlusTransactionId: "pp_test_001",
            createdAt: now - 20 * DAY,
        });

        await ctx.db.insert("paymentLogs", {
            participantId: p(1),
            amount: 50,
            currency: "ILS",
            status: "Success",
            payPlusTransactionId: "pp_test_002",
            createdAt: now - 18 * DAY,
        });

        await ctx.db.insert("paymentLogs", {
            participantId: p(3),
            amount: 50,
            currency: "ILS",
            status: "Failed",
            createdAt: now - 15 * DAY,
        });

        // ---- 12. Support tickets ----
        console.log("🎫 Seeding support tickets...");

        await ctx.db.insert("supportTickets", {
            participantId: p(2),
            telegramId: "tg_1003",
            question: "Как поменять регион в профиле?",
            status: "Open",
            createdAt: now - 2 * DAY,
        });

        await ctx.db.insert("supportTickets", {
            participantId: p(11),
            telegramId: "tg_1012",
            question: "Когда начнётся следующий сезон?",
            answer: "Весенний сезон планируется через 4 недели. Следите за обновлениями!",
            status: "Answered",
            createdAt: now - 5 * DAY,
        });

        // ---- 13. Bypass sessions (for dev testing) ----
        console.log("🔑 Seeding bypass sessions...");

        const sessionExpiry = now + 30 * DAY;

        // Session for Анна (Center)
        await ctx.db.insert("sessions", {
            telegramId: "tg_1001",
            token: "dev-token-anna",
            expiresAt: sessionExpiry,
            source: "dev",
        });

        // Session for Игорь (North)
        await ctx.db.insert("sessions", {
            telegramId: "tg_1006",
            token: "dev-token-igor",
            expiresAt: sessionExpiry,
            source: "dev",
        });

        // Session for Светлана (South)
        await ctx.db.insert("sessions", {
            telegramId: "tg_1011",
            token: "dev-token-svetlana",
            expiresAt: sessionExpiry,
            source: "dev",
        });

        // Session for a Lead participant
        await ctx.db.insert("sessions", {
            telegramId: "tg_1016",
            token: "dev-token-lead",
            expiresAt: sessionExpiry,
            source: "dev",
        });

        console.log("✅ Database seeded successfully!");
        console.log("   20 participants (15 Active, 3 Lead, 2 Inactive)");
        console.log("   3 seasons (1 Active, 1 Completed, 1 Draft)");
        console.log("   15 season enrollments (14 Enrolled, 1 Paused)");
        console.log("   5 tasks (4 Active, 1 Archive)");
        console.log("   8 groups (4 Completed week 1, 4 Active week 2)");
        console.log("   7 task assignments (various statuses)");
        console.log("   4 feedback entries");
        console.log("   3 payment logs");
        console.log("   2 support tickets");
        console.log("   4 bypass sessions (dev-token-anna, dev-token-igor, dev-token-svetlana, dev-token-lead)");
    },
});

// ============================================
// PUBLIC ACTIONS (temporary, for admin panel)
// ============================================

export const cleanAllPublic = action({
    args: {},
    handler: async (ctx) => {
        await ctx.runMutation(internal.seed.cleanAll, {});
        return "All data cleaned.";
    },
});

export const resetAndSeedPublic = action({
    args: {},
    handler: async (ctx) => {
        await ctx.runMutation(internal.seed.resetAndSeed, {});
        return "Database seeded.";
    },
});
