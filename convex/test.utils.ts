import { convexTest } from "convex-test";
import schema from "./schema";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import type {
    ParticipantStatus,
    Gender,
    Region,
    GroupStatus,
    SupportStatus,
    PaymentStatus,
    Currency,
    WouldMeetAgain,
    SeasonStatus,
    SeasonParticipantStatus,
    TaskType,
    TaskDifficulty,
    TaskPurpose,
    TaskReviewStatus,
    WeekInSeason,
} from "./validators";

/**
 * Create a fresh convexTest instance with schema.
 * Every test should call this to get an isolated database.
 * Sets up necessary environment variables for auth testing.
 */
export function setupTest() {
    process.env.AUTH_BYPASS_SECRET = "test-secret";
    process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
    return convexTest(schema);
}

/**
 * Create a bypass session for testing user-facing functions.
 * Returns the sessionToken that should be passed to userQuery/userMutation calls.
 */
export async function createTestSession(
    t: ReturnType<typeof setupTest>,
    telegramId: string
) {
    const { token } = await t.mutation(internal.authUser.createBypassSession, {
        secret: process.env.AUTH_BYPASS_SECRET!,
        telegramId,
        source: "test",
    });
    return token;
}

/**
 * Create a test client acting as an authenticated admin.
 * Use this to call adminQuery/adminMutation functions.
 */
export function withAdminIdentity(
    t: ReturnType<typeof setupTest>,
    email: string = "masha@koomasha.com"
) {
    return t.withIdentity({
        tokenIdentifier: `google|${email}`,
        issuer: "https://accounts.google.com",
        subject: `google|${email}`,
        name: "Admin User",
        email: email,
        picture: "https://example.com/photo.jpg",
        emailVerified: true,
    });
}

/**
 * Default participant data matching schema requirements.
 * Override any field by passing partial overrides.
 */
export function makeParticipant(
    overrides: Partial<{
        name: string;
        phone: string;
        telegramId: string;
        tgFirstName: string;
        tgLastName: string;
        photo: string;
        birthDate: string;
        age: number; // Virtual field for testing convenience
        gender: Gender;
        region: Region;
        city: string;
        aboutMe: string;
        profession: string;
        purpose: string;
        expectations: string;
        email: string;
        socialMediaConsent: boolean;
        status: ParticipantStatus;
        onPause: boolean;
        totalPoints: number;
        registrationDate: number;
        paidUntil: number;
        paymentDate: number;
        inChannel: boolean;
        periodsPaid: number;
    }> = {}
) {
    const { age, ...otherOverrides } = overrides;

    let defaultBirthDate = "1994-01-01";
    if (age !== undefined) {
        const year = new Date().getFullYear() - age;
        defaultBirthDate = `${year}-01-01`;
    }

    return {
        name: "Test User",
        phone: "+972501234567",
        telegramId: "100001",
        birthDate: defaultBirthDate,
        gender: "Male" as const,
        region: "Center" as const,
        status: "Active" as const,
        onPause: false,
        totalPoints: 0,
        registrationDate: Date.now(),
        inChannel: false,
        periodsPaid: 0,
        ...otherOverrides,
        // Ensure socialMediaConsent is always defined (can be overridden above)
        socialMediaConsent: otherOverrides.socialMediaConsent ?? true,
    };
}

/**
 * Default group data for testing.
 */
export function makeGroup(
    participant1: Id<"participants">,
    participant2: Id<"participants">,
    overrides: Partial<{
        participant3: Id<"participants">;
        participant4: Id<"participants">;
        status: GroupStatus;
        region: Region;
        createdAt: number;
    }> = {}
) {
    return {
        participant1,
        participant2,
        status: "Active",
        createdAt: Date.now(),
        ...overrides,
    };
}

/**
 * Default support ticket data for testing.
 */
export function makeSupportTicket(
    overrides: Partial<{
        participantId: Id<"participants">;
        telegramId: string;
        question: string;
        answer: string;
        status: SupportStatus;
        createdAt: number;
    }> = {}
) {
    return {
        telegramId: "100001",
        question: "Test question?",
        status: "Open",
        createdAt: Date.now(),
        ...overrides,
    };
}

/**
 * Default feedback data for testing.
 */
export function makeFeedback(
    groupId: Id<"groups">,
    participantId: Id<"participants">,
    overrides: Partial<{
        rating: number;
        textFeedback: string;
        wouldMeetAgain: WouldMeetAgain;
        photos: Id<"_storage">[];
        taskEffect: string;
        improvementSuggestion: string;
        submittedAt: number;
    }> = {}
) {
    return {
        groupId,
        participantId,
        rating: 4,
        submittedAt: Date.now(),
        ...overrides,
    };
}

/**
 * Default payment log data for testing.
 */
export function makePaymentLog(
    participantId: Id<"participants">,
    overrides: Partial<{
        amount: number;
        currency: Currency;
        status: PaymentStatus;
        payPlusTransactionId: string;
        createdAt: number;
    }> = {}
) {
    return {
        participantId,
        amount: 100,
        currency: "ILS",
        status: "Pending",
        createdAt: Date.now(),
        ...overrides,
    };
}

/**
 * Seed multiple participants and return their IDs.
 * Useful for matching algorithm tests that need many participants.
 */
export async function seedParticipants(
    t: ReturnType<typeof setupTest>,
    participants: Array<ReturnType<typeof makeParticipant>>
) {
    const ids: Id<"participants">[] = [];
    for (const p of participants) {
        const id = await t.run(async (ctx) => {
            return await ctx.db.insert("participants", p);
        });
        ids.push(id);
    }
    return ids;
}

/**
 * Create a unique telegramId for tests.
 * Call with an index to get unique IDs: uniqueTelegramId(1), uniqueTelegramId(2), etc.
 */
export function uniqueTelegramId(index: number): string {
    return `test_user_${100000 + index}`;
}

/**
 * Default season data for testing.
 */
export function makeSeason(
    overrides: Partial<{
        name: string;
        description: string;
        startDate: number;
        endDate: number;
        status: SeasonStatus;
        createdAt: number;
        createdByEmail: string;
    }> = {}
) {
    const now = Date.now();
    const fourWeeks = 4 * 7 * 24 * 60 * 60 * 1000;
    return {
        name: "Test Season",
        startDate: now,
        endDate: now + fourWeeks,
        status: "Draft" as const,
        createdAt: now,
        createdByEmail: "test@example.com",
        ...overrides,
    };
}

/**
 * Default season participant data for testing.
 */
export function makeSeasonParticipant(
    seasonId: Id<"seasons">,
    participantId: Id<"participants">,
    overrides: Partial<{
        enrolledAt: number;
        status: SeasonParticipantStatus;
    }> = {}
) {
    return {
        seasonId,
        participantId,
        enrolledAt: Date.now(),
        status: "Enrolled" as const,
        ...overrides,
    };
}

/**
 * Default task data for testing.
 */
export function makeTask(
    overrides: Partial<{
        title: string;
        description: string;
        onlineInstructions: string;
        reportInstructions: string;
        type: TaskType;
        difficulty: TaskDifficulty;
        purpose: TaskPurpose;
        status: "Active" | "Archive";
        createdAt: number;
        createdByEmail: string;
    }> = {}
) {
    return {
        title: "Test Task",
        description: "Test task description",
        reportInstructions: "Submit photos",
        type: "Activity" as const,
        difficulty: "Medium" as const,
        purpose: "Everyone" as const,
        status: "Active" as const,
        createdAt: Date.now(),
        ...overrides,
    };
}

/**
 * Default task assignment data for testing.
 */
export function makeTaskAssignment(
    groupId: Id<"groups">,
    taskId: Id<"tasks">,
    overrides: {
        seasonId: Id<"seasons">;
    } & Partial<{
        weekInSeason: WeekInSeason;
        assignedAt: number;
        assignedByEmail: string;
        completedAt: number;
        completionNotes: string;
        completionPhotos: Id<"_storage">[];
        submittedBy: Id<"participants">;
        submittedAt: number;
        reviewStatus: TaskReviewStatus;
        reviewedAt: number;
        reviewedByEmail: string;
        reviewComment: string;
        pointsAwarded: number;
        notCompletedReason: string;
    }>
) {
    const { seasonId, ...rest } = overrides;
    return {
        groupId,
        taskId,
        weekInSeason: 1 as const,
        seasonId,
        assignedAt: Date.now(),
        assignedByEmail: "admin@example.com",
        reviewStatus: "Pending" as const,
        pointsAwarded: 0,
        ...rest,
    };
}
