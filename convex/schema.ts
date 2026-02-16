import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
    participantStatusValidator,
    genderValidator,
    regionValidator,
    groupStatusValidator,
    paymentStatusValidator,
    currencyValidator,
    supportStatusValidator,
    sessionSourceValidator,
    wouldMeetAgainValidator,
} from "./validators";

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
        birthDate: v.string(), // YYYY-MM-DD format
        gender: genderValidator,
        region: regionValidator,
        city: v.optional(v.string()),

        // Profile
        aboutMe: v.optional(v.string()),
        profession: v.optional(v.string()),
        purpose: v.optional(v.string()),
        expectations: v.optional(v.string()),

        // Status
        status: participantStatusValidator,
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
        status: groupStatusValidator,
        region: v.optional(regionValidator),
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
        wouldMeetAgain: v.optional(wouldMeetAgainValidator),
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
        currency: currencyValidator,
        status: paymentStatusValidator,
        payPlusTransactionId: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_participantId", ["participantId"]),

    supportTickets: defineTable({
        participantId: v.optional(v.id("participants")),
        telegramId: v.string(),
        question: v.string(),
        answer: v.optional(v.string()),
        status: supportStatusValidator,
        createdAt: v.number(),
    }).index("by_status", ["status"]),

    sessions: defineTable({
        telegramId: v.string(),
        token: v.string(),
        expiresAt: v.number(),
        source: sessionSourceValidator,
    }).index("by_token", ["token"]),


});
