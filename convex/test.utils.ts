import { convexTest } from "convex-test";
import schema from "./schema";
import { Id } from "./_generated/dataModel";

/**
 * Create a fresh convexTest instance with schema.
 * Every test should call this to get an isolated database.
 */
export function setupTest() {
    return convexTest(schema);
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
        age: number;
        gender: string;
        region: string;
        city: string;
        familyStatus: string;
        targetGender: string;
        targetAgeFrom: number;
        targetAgeTo: number;
        formatPreference: string;
        aboutMe: string;
        profession: string;
        whoToMeet: string;
        values: string[];
        interests: string[];
        status: string;
        onPause: boolean;
        totalPoints: number;
        registrationDate: number;
        paidUntil: number;
        paymentDate: number;
        inChannel: boolean;
        periodsPaid: number;
    }> = {}
) {
    return {
        name: "Test User",
        phone: "+972501234567",
        telegramId: "100001",
        age: 30,
        gender: "Male",
        region: "Center",
        status: "Active",
        onPause: false,
        totalPoints: 0,
        registrationDate: Date.now(),
        inChannel: false,
        periodsPaid: 0,
        ...overrides,
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
        status: string;
        region: string;
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
        status: string;
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
        wouldMeetAgain: string;
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
        currency: string;
        status: string;
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
    t: ReturnType<typeof convexTest>,
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
