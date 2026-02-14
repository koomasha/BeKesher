import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    participants: defineTable({
        // Identity
        name: v.string(),
        phone: v.string(),
        telegramId: v.string(),
        tgFirstName: v.optional(v.string()),
        tgLastName: v.optional(v.string()),
        photo: v.optional(v.string()),

        // Demographics
        age: v.number(),
        birthDate: v.optional(v.string()), // YYYY-MM-DD format
        zodiacSign: v.optional(v.string()),
        gender: v.string(),
        region: v.string(), // "North" | "Center" | "South"
        city: v.optional(v.string()),
        familyStatus: v.optional(v.string()),

        // Preferences
        targetGender: v.optional(v.string()),
        targetAgeFrom: v.optional(v.number()),
        targetAgeTo: v.optional(v.number()),
        formatPreference: v.optional(v.string()),

        // Profile
        aboutMe: v.optional(v.string()),
        profession: v.optional(v.string()),
        whoToMeet: v.optional(v.string()),
        values: v.optional(v.array(v.string())),
        interests: v.optional(v.array(v.string())),

        // Status
        status: v.string(), // "Lead" | "Active" | "Inactive"
        onPause: v.boolean(),
        totalPoints: v.number(),
        registrationDate: v.number(),

        // Subscription
        paidUntil: v.optional(v.number()),
        paymentDate: v.optional(v.number()),
        inChannel: v.boolean(),
        periodsPaid: v.number(),
    })
        .index("by_telegramId", ["telegramId"])
        .index("by_status", ["status"])
        .index("by_status_and_region", ["status", "region"])
        .index("by_status_and_onPause", ["status", "onPause"]),

    groups: defineTable({
        createdAt: v.number(),
        status: v.string(), // "Active" | "Completed" | "Cancelled"
        region: v.optional(v.string()),
        participant1: v.id("participants"),
        participant2: v.id("participants"),
        participant3: v.optional(v.id("participants")),
        participant4: v.optional(v.id("participants")),
    })
        .index("by_status", ["status"])
        .index("by_createdAt", ["createdAt"]),

    feedback: defineTable({
        groupId: v.id("groups"),
        participantId: v.id("participants"),
        rating: v.number(),
        textFeedback: v.optional(v.string()),
        wouldMeetAgain: v.optional(v.string()),
        photos: v.optional(v.array(v.id("_storage"))),
        taskEffect: v.optional(v.string()),
        improvementSuggestion: v.optional(v.string()),
        submittedAt: v.number(),
    })
        .index("by_groupId", ["groupId"])
        .index("by_participantId", ["participantId"]),

    paymentLogs: defineTable({
        participantId: v.id("participants"),
        amount: v.number(),
        currency: v.string(),
        status: v.string(),
        payPlusTransactionId: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_participantId", ["participantId"]),

    supportTickets: defineTable({
        participantId: v.optional(v.id("participants")),
        telegramId: v.string(),
        question: v.string(),
        answer: v.optional(v.string()),
        status: v.string(), // "Open" | "Answered" | "Closed"
        createdAt: v.number(),
    }).index("by_status", ["status"]),

    admins: defineTable({
        email: v.string(),
        passwordHash: v.string(),
        name: v.string(),
    }).index("by_email", ["email"]),
});
