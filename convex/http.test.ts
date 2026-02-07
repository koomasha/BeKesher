import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import { setupTest, makeParticipant, seedParticipants, uniqueTelegramId } from "./test.utils";

describe("http", () => {
    // ============================================
    // HEALTH CHECK TESTS
    // ============================================

    describe("GET /health", () => {
        test("returns 200 with status ok", async () => {
            const t = setupTest();

            const response = await t.fetch("/health", { method: "GET" });

            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body.status).toBe("ok");
            expect(body.timestamp).toBeDefined();
        });
    });

    // ============================================
    // PAYPLUS CALLBACK TESTS
    // ============================================

    describe("POST /payplus-callback", () => {
        test("processes successful payment (status_code 000)", async () => {
            const t = setupTest();

            const [participantId] = await seedParticipants(t, [
                makeParticipant({
                    telegramId: "payplususer1",
                    status: "Lead",
                    periodsPaid: 0,
                }),
            ]);

            // Create a pending payment
            await t.mutation(internal.payments.logPaymentAttempt, {
                participantId,
                amount: 100,
                currency: "ILS",
            });

            const response = await t.fetch("/payplus-callback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transaction: {
                        status_code: "000",
                        uid: "TXN123456",
                        amount: 100,
                    },
                    more_info: participantId,
                }),
            });

            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body.ok).toBe(true);

            // Verify participant was activated
            const participant = await t.query(api.participants.getByTelegramId, {
                telegramId: "payplususer1",
            });
            expect(participant?.status).toBe("Active");
        });

        test("processes failed payment (non-000 status_code)", async () => {
            const t = setupTest();

            const [participantId] = await seedParticipants(t, [
                makeParticipant({
                    telegramId: "payplususer2",
                    status: "Lead",
                }),
            ]);

            // Create a pending payment
            await t.mutation(internal.payments.logPaymentAttempt, {
                participantId,
                amount: 100,
                currency: "ILS",
            });

            const response = await t.fetch("/payplus-callback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transaction: {
                        status_code: "500",
                        uid: "TXN654321",
                        amount: 100,
                    },
                    more_info: participantId,
                }),
            });

            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body.ok).toBe(true);

            // Verify payment was marked as failed
            const history = await t.query(api.payments.getPaymentHistory, {
                telegramId: "payplususer2",
            });
            expect(history[0].status).toBe("Failed");
        });

        test("returns 400 when participantId is missing", async () => {
            const t = setupTest();

            const response = await t.fetch("/payplus-callback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transaction: {
                        status_code: "000",
                        uid: "TXN123",
                        amount: 100,
                    },
                    // more_info is missing
                }),
            });

            expect(response.status).toBe(400);

            const body = await response.json();
            expect(body.error).toBe("Missing participant ID");
        });

        test("returns 500 on malformed body", async () => {
            const t = setupTest();

            const response = await t.fetch("/payplus-callback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: "not valid json{{{",
            });

            expect(response.status).toBe(500);
        });
    });

    // ============================================
    // TELEGRAM WEBHOOK TESTS
    // ============================================

    describe("POST /telegram-webhook", () => {
        test("handles callback query (button press)", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({
                    telegramId: "123456789",
                    onPause: false,
                }),
            ]);

            const response = await t.fetch("/telegram-webhook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    callback_query: {
                        data: "menu_pause",
                        from: { id: 123456789 },
                        message: { chat: { id: 123456789 } },
                    },
                }),
            });

            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body.ok).toBe(true);

            // Verify pause was toggled
            const participant = await t.query(api.participants.getByTelegramId, {
                telegramId: "123456789",
            });
            expect(participant?.onPause).toBe(true);
        });

        test("handles /start command", async () => {
            const t = setupTest();

            const response = await t.fetch("/telegram-webhook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: {
                        text: "/start",
                        chat: { id: 999999 },
                    },
                }),
            });

            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body.ok).toBe(true);
        });

        test("handles empty update (returns 200 ok)", async () => {
            const t = setupTest();

            const response = await t.fetch("/telegram-webhook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body.ok).toBe(true);
        });

        test("handles various callback query types", async () => {
            const t = setupTest();

            const callbackTypes = [
                "menu_profile",
                "menu_edit",
                "menu_payment",
                "menu_support",
            ];

            for (const callbackData of callbackTypes) {
                const response = await t.fetch("/telegram-webhook", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        callback_query: {
                            data: callbackData,
                            from: { id: 111222333 },
                            message: { chat: { id: 111222333 } },
                        },
                    }),
                });

                expect(response.status).toBe(200);
            }
        });
    });
});
