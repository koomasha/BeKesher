import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTest, makeParticipant, seedParticipants, uniqueTelegramId, createTestSession, withAdminIdentity } from "./test.utils";

describe("support", () => {
    // ============================================
    // CREATE TICKET TESTS
    // ============================================

    describe("createTicket", () => {
        test("creates ticket with Open status and links to participant if exists", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: "supportuser", name: "Support User" }),
            ]);

            const token = await createTestSession(t, "supportuser");
            const ticketId = await t.mutation(api.support.createTicket, {
                sessionToken: token,
                question: "How do I update my profile?",
            });

            expect(ticketId).toBeDefined();

            const tickets = await t.query(api.support.getMyTickets, {
                sessionToken: token,
            });

            expect(tickets).toHaveLength(1);
            expect(tickets[0].question).toBe("How do I update my profile?");
            expect(tickets[0].status).toBe("Open");
            expect(tickets[0].answer).toBeUndefined();
        });

        test("creates ticket without participant (unregistered user)", async () => {
            const t = setupTest();

            // No participant with this telegramId
            const token = await createTestSession(t, "unregistered123");
            const ticketId = await t.mutation(api.support.createTicket, {
                sessionToken: token,
                question: "How do I sign up?",
            });

            expect(ticketId).toBeDefined();

            const tickets = await t.query(api.support.getMyTickets, {
                sessionToken: token,
            });

            expect(tickets).toHaveLength(1);
            expect(tickets[0].question).toBe("How do I sign up?");
        });

        test("throws on empty question", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "testuser");
            await expect(
                t.mutation(api.support.createTicket, {
                    sessionToken: token,
                    question: "",
                })
            ).rejects.toThrowError("Question cannot be empty");
        });

        test("throws on whitespace-only question", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "testuser");
            await expect(
                t.mutation(api.support.createTicket, {
                    sessionToken: token,
                    question: "   ",
                })
            ).rejects.toThrowError("Question cannot be empty");
        });
    });

    // ============================================
    // QUERY TESTS
    // ============================================

    describe("getMyTickets", () => {
        test("returns tickets for a telegramId", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: "ticketuser" }),
            ]);

            const token = await createTestSession(t, "ticketuser");
            await t.mutation(api.support.createTicket, {
                sessionToken: token,
                question: "Question 1",
            });

            await t.mutation(api.support.createTicket, {
                sessionToken: token,
                question: "Question 2",
            });

            const otherToken = await createTestSession(t, "otheruser");
            await t.mutation(api.support.createTicket, {
                sessionToken: otherToken,
                question: "Other user question",
            });

            const myTickets = await t.query(api.support.getMyTickets, {
                sessionToken: token,
            });

            expect(myTickets).toHaveLength(2);
        });

        test("returns empty array for user with no tickets", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "notickets");
            const tickets = await t.query(api.support.getMyTickets, {
                sessionToken: token,
            });

            expect(tickets).toHaveLength(0);
        });
    });

    describe("list", () => {
        test("returns all tickets with participant name enrichment", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: "named_user", name: "Named User" }),
            ]);

            const namedToken = await createTestSession(t, "named_user");
            await t.mutation(api.support.createTicket, {
                sessionToken: namedToken,
                question: "Question from named user",
            });

            const anonToken = await createTestSession(t, "anonymous_user");
            await t.mutation(api.support.createTicket, {
                sessionToken: anonToken,
                question: "Question from anonymous",
            });

            const admin = withAdminIdentity(t);
            const allTickets = await admin.query(api.support.list, {});

            expect(allTickets).toHaveLength(2);

            // @ts-ignore
            const namedTicket = allTickets.find(
                (t) => t.telegramId === "named_user"
            );
            expect(namedTicket?.participantName).toBe("Named User");

            // @ts-ignore
            const anonTicket = allTickets.find(
                (t) => t.telegramId === "anonymous_user"
            );
            expect(anonTicket?.participantName).toBeUndefined();
        });

        test("filters by status", async () => {
            const t = setupTest();

            const token1 = await createTestSession(t, uniqueTelegramId(1));
            const ticketId1 = await t.mutation(api.support.createTicket, {
                sessionToken: token1,
                question: "Open question",
            });

            const token2 = await createTestSession(t, uniqueTelegramId(2));
            const ticketId2 = await t.mutation(api.support.createTicket, {
                sessionToken: token2,
                question: "Answered question",
            });

            const admin = withAdminIdentity(t);
            await admin.mutation(api.support.answerTicket, {
                ticketId: ticketId2,
                answer: "Here is your answer",
            });

            const openTickets = await admin.query(api.support.list, { status: "Open" });
            expect(openTickets).toHaveLength(1);

            const answeredTickets = await admin.query(api.support.list, {
                status: "Answered",
            });
            expect(answeredTickets).toHaveLength(1);
        });
    });

    // ============================================
    // ANSWER TICKET TESTS
    // ============================================

    describe("answerTicket", () => {
        test("sets answer and status to Answered", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "answertest");
            const ticketId = await t.mutation(api.support.createTicket, {
                sessionToken: token,
                question: "What is the meaning of life?",
            });

            const admin = withAdminIdentity(t);
            await admin.mutation(api.support.answerTicket, {
                ticketId,
                answer: "42",
            });

            const tickets = await t.query(api.support.getMyTickets, {
                sessionToken: token,
            });

            expect(tickets[0].answer).toBe("42");
            expect(tickets[0].status).toBe("Answered");
        });

        test("throws on non-existent ticket", async () => {
            const t = setupTest();

            // Create and delete a ticket to get a valid-looking but non-existent ID
            const token = await createTestSession(t, "temp");
            const ticketId = await t.mutation(api.support.createTicket, {
                sessionToken: token,
                question: "Temp question",
            });

            await t.run(async (ctx) => {
                await ctx.db.delete(ticketId);
            });

            const admin = withAdminIdentity(t);
            await expect(
                admin.mutation(api.support.answerTicket, {
                    ticketId,
                    answer: "This should fail",
                })
            ).rejects.toThrowError("Ticket not found");
        });

        test("throws on empty answer", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "emptyanswertest");
            const ticketId = await t.mutation(api.support.createTicket, {
                sessionToken: token,
                question: "A question",
            });

            const admin = withAdminIdentity(t);
            await expect(
                admin.mutation(api.support.answerTicket, {
                    ticketId,
                    answer: "",
                })
            ).rejects.toThrowError("Answer cannot be empty");
        });

        test("throws on whitespace-only answer", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "whitespacetest");
            const ticketId = await t.mutation(api.support.createTicket, {
                sessionToken: token,
                question: "A question",
            });

            const admin = withAdminIdentity(t);
            await expect(
                admin.mutation(api.support.answerTicket, {
                    ticketId,
                    answer: "   ",
                })
            ).rejects.toThrowError("Answer cannot be empty");
        });
    });

    // ============================================
    // CLOSE TICKET TESTS
    // ============================================

    describe("closeTicket", () => {
        test("sets status to Closed", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "closetest");
            const ticketId = await t.mutation(api.support.createTicket, {
                sessionToken: token,
                question: "A question to close",
            });

            const admin = withAdminIdentity(t);
            await admin.mutation(api.support.closeTicket, { ticketId });

            const tickets = await t.query(api.support.getMyTickets, {
                sessionToken: token,
            });

            expect(tickets[0].status).toBe("Closed");
        });

        test("throws on non-existent ticket", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "temp");
            const ticketId = await t.mutation(api.support.createTicket, {
                sessionToken: token,
                question: "Temp question",
            });

            await t.run(async (ctx) => {
                await ctx.db.delete(ticketId);
            });

            const admin = withAdminIdentity(t);
            await expect(
                admin.mutation(api.support.closeTicket, { ticketId })
            ).rejects.toThrowError("Ticket not found");
        });

        test("can close an already answered ticket", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "answerthenclose");
            const ticketId = await t.mutation(api.support.createTicket, {
                sessionToken: token,
                question: "Question",
            });

            const admin = withAdminIdentity(t);
            await admin.mutation(api.support.answerTicket, {
                ticketId,
                answer: "Answer",
            });

            await admin.mutation(api.support.closeTicket, { ticketId });

            const tickets = await t.query(api.support.getMyTickets, {
                sessionToken: token,
            });

            expect(tickets[0].status).toBe("Closed");
            expect(tickets[0].answer).toBe("Answer");
        });
    });
});
