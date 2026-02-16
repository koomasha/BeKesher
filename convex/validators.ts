import { v } from "convex/values";
import type { Infer } from "convex/values";

// ============================================
// PARTICIPANT FIELD VALIDATORS
// ============================================

/**
 * Participant status validator
 * Values: "Lead" (new registration), "Active" (paid), "Inactive" (stopped)
 */
export const participantStatusValidator = v.union(
  v.literal("Lead"),
  v.literal("Active"),
  v.literal("Inactive")
);

/**
 * Gender validator
 * Values: "Male", "Female", "Other"
 */
export const genderValidator = v.union(
  v.literal("Male"),
  v.literal("Female"),
  v.literal("Other")
);

/**
 * Region validator
 * Values: "North", "Center", "South"
 */
export const regionValidator = v.union(
  v.literal("North"),
  v.literal("Center"),
  v.literal("South")
);

// ============================================
// GROUP FIELD VALIDATORS
// ============================================

/**
 * Group status validator
 * Values: "Active" (current week), "Completed" (finished), "Cancelled" (cancelled)
 */
export const groupStatusValidator = v.union(
  v.literal("Active"),
  v.literal("Completed"),
  v.literal("Cancelled")
);

// ============================================
// PAYMENT FIELD VALIDATORS
// ============================================

/**
 * Payment status validator
 * Values: "Pending" (awaiting), "Success" (completed), "Failed" (failed)
 */
export const paymentStatusValidator = v.union(
  v.literal("Pending"),
  v.literal("Success"),
  v.literal("Failed")
);

/**
 * Currency validator
 * Values: "ILS" (Israeli Shekel)
 */
export const currencyValidator = v.union(
  v.literal("ILS")
);

// ============================================
// SUPPORT TICKET FIELD VALIDATORS
// ============================================

/**
 * Support ticket status validator
 * Values: "Open" (new), "Answered" (admin replied), "Closed" (resolved)
 */
export const supportStatusValidator = v.union(
  v.literal("Open"),
  v.literal("Answered"),
  v.literal("Closed")
);

// ============================================
// SESSION FIELD VALIDATORS
// ============================================

/**
 * Session source validator
 * Values: "ai", "cicd", "dev", "test"
 */
export const sessionSourceValidator = v.union(
  v.literal("ai"),
  v.literal("cicd"),
  v.literal("dev"),
  v.literal("test")
);

// ============================================
// FEEDBACK FIELD VALIDATORS
// ============================================

/**
 * Would meet again validator
 * Values: "yes", "no", "maybe"
 */
export const wouldMeetAgainValidator = v.union(
  v.literal("yes"),
  v.literal("no"),
  v.literal("maybe")
);

// ============================================
// SEASON FIELD VALIDATORS
// ============================================

/**
 * Season status validator
 * Values: "Draft" (being set up), "Active" (currently running), "Completed" (finished)
 */
export const seasonStatusValidator = v.union(
  v.literal("Draft"),
  v.literal("Active"),
  v.literal("Completed")
);

/**
 * Season participant status validator
 * Values: "Enrolled" (active in season), "Paused" (skip this week), "Completed" (finished all 4 weeks), "Dropped" (left early)
 */
export const seasonParticipantStatusValidator = v.union(
  v.literal("Enrolled"),
  v.literal("Paused"),
  v.literal("Completed"),
  v.literal("Dropped")
);

// ============================================
// TASK FIELD VALIDATORS
// ============================================

/**
 * Task type validator
 * Values: "Activity" (physical activity), "Conversation" (discussion), "Creative" (creative challenge), "Philosophy" (philosophical question)
 */
export const taskTypeValidator = v.union(
  v.literal("Activity"),
  v.literal("Conversation"),
  v.literal("Creative"),
  v.literal("Philosophy")
);

/**
 * Task difficulty validator
 * Values: "Easy", "Medium", "Hard"
 */
export const taskDifficultyValidator = v.union(
  v.literal("Easy"),
  v.literal("Medium"),
  v.literal("Hard")
);

/**
 * Task purpose validator
 * Values: "Everyone" (all participants), "Romantic" (romantic connections), "Friendship" (platonic connections)
 */
export const taskPurposeValidator = v.union(
  v.literal("Everyone"),
  v.literal("Romantic"),
  v.literal("Friendship")
);

/**
 * Task review status validator
 * Values: "Pending" (awaiting review), "Approved" (accepted), "Revision" (needs changes), "Rejected" (not accepted), "NotCompleted" (task not done)
 */
export const taskReviewStatusValidator = v.union(
  v.literal("Pending"),
  v.literal("Approved"),
  v.literal("Revision"),
  v.literal("Rejected"),
  v.literal("NotCompleted")
);

/**
 * Week in season validator
 * Values: 1, 2, 3, 4
 */
export const weekInSeasonValidator = v.union(
  v.literal(1),
  v.literal(2),
  v.literal(3),
  v.literal(4)
);

// ============================================
// TYPESCRIPT TYPE EXPORTS
// ============================================

export type ParticipantStatus = Infer<typeof participantStatusValidator>;
export type Gender = Infer<typeof genderValidator>;
export type Region = Infer<typeof regionValidator>;
export type GroupStatus = Infer<typeof groupStatusValidator>;
export type PaymentStatus = Infer<typeof paymentStatusValidator>;
export type Currency = Infer<typeof currencyValidator>;
export type SupportStatus = Infer<typeof supportStatusValidator>;
export type SessionSource = Infer<typeof sessionSourceValidator>;
export type WouldMeetAgain = Infer<typeof wouldMeetAgainValidator>;
export type SeasonStatus = Infer<typeof seasonStatusValidator>;
export type SeasonParticipantStatus = Infer<typeof seasonParticipantStatusValidator>;
export type TaskType = Infer<typeof taskTypeValidator>;
export type TaskDifficulty = Infer<typeof taskDifficultyValidator>;
export type TaskPurpose = Infer<typeof taskPurposeValidator>;
export type TaskReviewStatus = Infer<typeof taskReviewStatusValidator>;
export type WeekInSeason = Infer<typeof weekInSeasonValidator>;
