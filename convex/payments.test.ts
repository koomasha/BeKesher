import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import { setupTest, makeParticipant, seedParticipants, uniqueTelegramId, createTestSession } from "./test.utils";

describe("payments", () => {
    // ============================================
    // INTERNAL MUTATION TESTS
    // ============================================

    describe("logPaymentAttempt (internal)", () => {
        test("creates payment log with Pending status", async () => {
            const t = setupTest();

            const [participantId] = await seedParticipants(t, [
                makeParticipant({ telegramId: "paymentloguser" }),
            ]);

            const paymentLogId = await t.mutation(internal.payments.logPaymentAttempt, {
                participantId,
                amount: 150,
                currency: "ILS",
            });

            expect(paymentLogId).toBeDefined();

            const token = await createTestSession(t, "paymentloguser");
            const history = await t.query(api.payments.getPaymentHistory, {
                sessionToken: token,
            });

            expect(history).toHaveLength(1);
            expect(history[0].amount).toBe(150);
            expect(history[0].currency).toBe("ILS");
            expect(history[0].status).toBe("Pending");
        });
    });

    describe("processSuccessfulPayment (internal)", () => {
        test("updates pending log to Success and activates participant", async () => {
            const t = setupTest();

            const [participantId] = await seedParticipants(t, [
                makeParticipant({
                    telegramId: "successuser",
                    status: "Lead",
                    periodsPaid: 0,
                }),
            ]);

            // Create pending payment
            await t.mutation(internal.payments.logPaymentAttempt, {
                participantId,
                amount: 100,
                currency: "ILS",
            });

            // Process successful payment
            await t.mutation(internal.payments.processSuccessfulPayment, {
                participantId,
                transactionId: "TXN123",
                amount: 100,
                months: 1,
            });

            // Check payment log is updated
            const token = await createTestSession(t, "successuser");
            const history = await t.query(api.payments.getPaymentHistory, {
                sessionToken: token,
            });

            expect(history[0].status).toBe("Success");

            // Check participant is activated
            const participant = await t.query(api.participants.getByTelegramId, {
                sessionToken: token,
            });

            expect(participant?.status).toBe("Active");
            expect(participant?.periodsPaid).toBe(1);
            expect(participant?.paidUntil).toBeDefined();
        });

        test("creates new log if no pending log exists", async () => {
            const t = setupTest();

            const [participantId] = await seedParticipants(t, [
                makeParticipant({
                    telegramId: "nopendinguser",
                    status: "Lead",
                }),
            ]);

            // Process successful payment without prior pending log
            await t.mutation(internal.payments.processSuccessfulPayment, {
                participantId,
                transactionId: "TXN456",
                amount: 200,
                months: 2,
            });

            const token = await createTestSession(t, "nopendinguser");
            const history = await t.query(api.payments.getPaymentHistory, {
                sessionToken: token,
            });

            expect(history).toHaveLength(1);
            expect(history[0].status).toBe("Success");
            expect(history[0].amount).toBe(200);
        });

        test("extends from current paidUntil if still in the future", async () => {
            const t = setupTest();

            // Set paidUntil to 10 days in the future
            const futurePaidUntil = Date.now() + 10 * 24 * 60 * 60 * 1000;

            const [participantId] = await seedParticipants(t, [
                makeParticipant({
                    telegramId: "extenduser",
                    status: "Active",
                    paidUntil: futurePaidUntil,
                    periodsPaid: 1,
                }),
            ]);

            await t.mutation(internal.payments.processSuccessfulPayment, {
                participantId,
                transactionId: "TXN789",
                amount: 100,
                months: 1,
            });

            const token = await createTestSession(t, "extenduser");
            const participant = await t.query(api.participants.getByTelegramId, {
                sessionToken: token,
            });

            // New paidUntil should be ~40 days from now (10 existing + 30 new)
            const expectedMin = futurePaidUntil + 29 * 24 * 60 * 60 * 1000;
            expect(participant?.paidUntil).toBeGreaterThan(expectedMin);
            expect(participant?.periodsPaid).toBe(2);
        });

        test("throws when participant not found", async () => {
            const t = setupTest();

            const [participantId] = await seedParticipants(t, [
                makeParticipant({ telegramId: "temp" }),
            ]);

            await t.run(async (ctx) => {
                await ctx.db.delete(participantId);
            });

            await expect(
                t.mutation(internal.payments.processSuccessfulPayment, {
                    participantId,
                    transactionId: "TXN000",
                    amount: 100,
                    months: 1,
                })
            ).rejects.toThrowError("Participant not found");
        });
    });

    describe("processFailedPayment (internal)", () => {
        test("updates pending log to Failed", async () => {
            const t = setupTest();

            const [participantId] = await seedParticipants(t, [
                makeParticipant({ telegramId: "failuser" }),
            ]);

            // Create pending payment
            await t.mutation(internal.payments.logPaymentAttempt, {
                participantId,
                amount: 100,
                currency: "ILS",
            });

            // Process failed payment
            await t.mutation(internal.payments.processFailedPayment, {
                participantId,
                transactionId: "FAIL123",
                reason: "Card declined",
            });

            const token = await createTestSession(t, "failuser");
            const history = await t.query(api.payments.getPaymentHistory, {
                sessionToken: token,
            });

            expect(history[0].status).toBe("Failed");
        });

        test("does nothing if no pending log exists", async () => {
            const t = setupTest();

            const [participantId] = await seedParticipants(t, [
                makeParticipant({ telegramId: "nopendingfail" }),
            ]);

            // This should not throw
            await t.mutation(internal.payments.processFailedPayment, {
                participantId,
                reason: "Test failure",
            });

            const token = await createTestSession(t, "nopendingfail");
            const history = await t.query(api.payments.getPaymentHistory, {
                sessionToken: token,
            });

            expect(history).toHaveLength(0);
        });
    });

    // ============================================
    // QUERY TESTS
    // ============================================

    describe("getPaymentHistory", () => {
        test("returns payments for a participant ordered desc", async () => {
            const t = setupTest();

            const [participantId] = await seedParticipants(t, [
                makeParticipant({ telegramId: "historyuser" }),
            ]);

            // Create multiple payments
            await t.mutation(internal.payments.logPaymentAttempt, {
                participantId,
                amount: 100,
                currency: "ILS",
            });

            // Wait a bit to ensure different timestamps
            await new Promise((resolve) => setTimeout(resolve, 10));

            await t.mutation(internal.payments.logPaymentAttempt, {
                participantId,
                amount: 200,
                currency: "ILS",
            });

            const token = await createTestSession(t, "historyuser");
            const history = await t.query(api.payments.getPaymentHistory, {
                sessionToken: token,
            });

            expect(history).toHaveLength(2);
            // Most recent should be first (amount: 200)
            expect(history[0].amount).toBe(200);
            expect(history[1].amount).toBe(100);
        });

        test("returns empty array for participant with no payments", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: "nopaymentuser" }),
            ]);

            const token = await createTestSession(t, "nopaymentuser");
            const history = await t.query(api.payments.getPaymentHistory, {
                sessionToken: token,
            });

            expect(history).toHaveLength(0);
        });

        test("returns empty array for non-existent participant", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "nonexistent");
            const history = await t.query(api.payments.getPaymentHistory, {
                sessionToken: token,
            });

            expect(history).toHaveLength(0);
        });
    });

    // ============================================
    // INTERNAL QUERY TESTS
    // ============================================

    describe("getParticipantByTelegramId (internal)", () => {
        test("returns {_id, name, phone} when found", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({
                    telegramId: "lookupuser",
                    name: "Lookup User",
                    phone: "+972501234567",
                }),
            ]);

            const result = await t.query(internal.payments.getParticipantByTelegramId, {
                telegramId: "lookupuser",
            });

            expect(result).not.toBeNull();
            expect(result?.name).toBe("Lookup User");
            expect(result?.phone).toBe("+972501234567");
            expect(result?._id).toBeDefined();
        });

        test("returns null when not found", async () => {
            const t = setupTest();

            const result = await t.query(internal.payments.getParticipantByTelegramId, {
                telegramId: "nonexistent",
            });

            expect(result).toBeNull();
        });
    });
});
