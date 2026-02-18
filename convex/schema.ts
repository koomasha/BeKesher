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
    seasonStatusValidator,
    seasonParticipantStatusValidator,
    taskTypeValidator,
    taskDifficultyValidator,
    taskPurposeValidator,
    taskReviewStatusValidator,
    weekInSeasonValidator,
} from "./validators";

export default defineSchema({
    participants: defineTable({
        // Identity
        name: v.string(),
        phone: v.string(),
        telegramId: v.string(),
        tgFirstName: v.optional(v.string()),
        tgLastName: v.optional(v.string()),
        tgUsername: v.optional(v.string()),
        photo: v.optional(v.string()),
        email: v.optional(v.string()),

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
        socialMediaConsent: v.boolean(),

        // Status
        status: participantStatusValidator,
        onPause: v.boolean(),
        totalPoints: v.number(),
        registrationDate: v.number(),

        // Subscription
        paidUntil: v.optional(v.number()),
        paymentDate: v.optional(v.number()),
        periodsPaid: v.number(),
    })
        .index("by_telegramId", ["telegramId"])
        .index("by_status", ["status"])
        .index("by_status_and_region", ["status", "region"])
        .index("by_status_and_onPause", ["status", "onPause"]),

    participantChangeLogs: defineTable({
        participantId: v.id("participants"),
        field: v.string(), // Name of the field that changed
        oldValue: v.union(v.string(), v.null()), // Previous value as string
        newValue: v.union(v.string(), v.null()), // New value as string
        changedAt: v.number(), // Timestamp
    })
        .index("by_participantId", ["participantId"])
        .index("by_participantId_and_changedAt", ["participantId", "changedAt"]),

    seasons: defineTable({
        name: v.string(),
        description: v.optional(v.string()),
        startDate: v.number(),  // First Saturday 18:00 timestamp
        endDate: v.number(),    // Last Saturday 23:00 (4 weeks later)
        status: seasonStatusValidator,
        createdAt: v.number(),
        createdByEmail: v.string(),  // Admin email from ctx.adminEmail
    })
        .index("by_status", ["status"])
        .index("by_createdAt", ["createdAt"]),

    seasonParticipants: defineTable({
        seasonId: v.id("seasons"),
        participantId: v.id("participants"),
        enrolledAt: v.number(),
        status: seasonParticipantStatusValidator,
    })
        .index("by_seasonId", ["seasonId"])
        .index("by_participantId", ["participantId"])
        .index("by_seasonId_and_status", ["seasonId", "status"])
        .index("by_seasonId_and_participantId", ["seasonId", "participantId"]),

    tasks: defineTable({
        title: v.string(),
        description: v.string(),
        onlineInstructions: v.optional(v.string()),
        reportInstructions: v.string(),
        type: taskTypeValidator,
        difficulty: taskDifficultyValidator,
        purpose: taskPurposeValidator,
        status: v.union(v.literal("Active"), v.literal("Archive")),
        createdAt: v.number(),
        createdByEmail: v.optional(v.string()),
    })
        .index("by_status", ["status"])
        .index("by_type", ["type"]),

    taskAssignments: defineTable({
        groupId: v.id("groups"),
        taskId: v.id("tasks"),
        weekInSeason: weekInSeasonValidator,
        seasonId: v.id("seasons"),

        // Assignment tracking
        assignedAt: v.number(),
        assignedByEmail: v.string(),

        // Participant submission
        completedAt: v.optional(v.number()),
        completionNotes: v.optional(v.string()),
        completionPhotos: v.optional(v.array(v.id("_storage"))),
        submittedBy: v.optional(v.id("participants")),
        submittedAt: v.optional(v.number()),

        // Admin review
        reviewStatus: taskReviewStatusValidator,
        reviewedAt: v.optional(v.number()),
        reviewedByEmail: v.optional(v.string()),
        reviewComment: v.optional(v.string()),
        pointsAwarded: v.number(),

        // Analytics
        notCompletedReason: v.optional(v.string()),
    })
        .index("by_groupId", ["groupId"])
        .index("by_taskId", ["taskId"])
        .index("by_reviewStatus", ["reviewStatus"])
        .index("by_submittedBy", ["submittedBy"])
        .index("by_weekInSeason", ["weekInSeason"])
        .index("by_seasonId", ["seasonId"]),

    groups: defineTable({
        createdAt: v.number(),
        status: groupStatusValidator,
        region: v.optional(regionValidator),
        participant1: v.id("participants"),
        participant2: v.id("participants"),
        participant3: v.optional(v.id("participants")),
        participant4: v.optional(v.id("participants")),

        // Season integration fields
        seasonId: v.optional(v.id("seasons")),
        weekInSeason: v.optional(weekInSeasonValidator),
        taskId: v.optional(v.id("tasks")),
    })
        .index("by_status", ["status"])
        .index("by_createdAt", ["createdAt"])
        .index("by_seasonId", ["seasonId"])
        .index("by_seasonId_and_weekInSeason", ["seasonId", "weekInSeason"])
        .index("by_seasonId_and_status", ["seasonId", "status"])
        .index("by_participant1", ["participant1"])
        .index("by_participant2", ["participant2"])
        .index("by_participant3", ["participant3"])
        .index("by_participant4", ["participant4"]),

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
