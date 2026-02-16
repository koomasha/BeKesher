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
