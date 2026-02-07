import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTest, makeParticipant, seedParticipants, uniqueTelegramId } from "./test.utils";

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

            const ticketId = await t.mutation(api.support.createTicket, {
                telegramId: "supportuser",
                question: "How do I update my profile?",
            });

            expect(ticketId).toBeDefined();

            const tickets = await t.query(api.support.getMyTickets, {
                telegramId: "supportuser",
            });

            expect(tickets).toHaveLength(1);
            expect(tickets[0].question).toBe("How do I update my profile?");
            expect(tickets[0].status).toBe("Open");
            expect(tickets[0].answer).toBeUndefined();
        });

        test("creates ticket without participant (unregistered user)", async () => {
            const t = setupTest();

            // No participant with this telegramId
            const ticketId = await t.mutation(api.support.createTicket, {
                telegramId: "unregistered123",
                question: "How do I sign up?",
            });

            expect(ticketId).toBeDefined();

            const tickets = await t.query(api.support.getMyTickets, {
                telegramId: "unregistered123",
            });

            expect(tickets).toHaveLength(1);
            expect(tickets[0].question).toBe("How do I sign up?");
        });

        test("throws on empty question", async () => {
            const t = setupTest();

            await expect(
                t.mutation(api.support.createTicket, {
                    telegramId: "testuser",
                    question: "",
                })
            ).rejects.toThrowError("Question cannot be empty");
        });

        test("throws on whitespace-only question", async () => {
            const t = setupTest();

            await expect(
                t.mutation(api.support.createTicket, {
                    telegramId: "testuser",
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

            await t.mutation(api.support.createTicket, {
                telegramId: "ticketuser",
                question: "Question 1",
            });

            await t.mutation(api.support.createTicket, {
                telegramId: "ticketuser",
                question: "Question 2",
            });

            await t.mutation(api.support.createTicket, {
                telegramId: "otheruser",
                question: "Other user question",
            });

            const myTickets = await t.query(api.support.getMyTickets, {
                telegramId: "ticketuser",
            });

            expect(myTickets).toHaveLength(2);
        });

        test("returns empty array for user with no tickets", async () => {
            const t = setupTest();

            const tickets = await t.query(api.support.getMyTickets, {
                telegramId: "notickets",
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

            await t.mutation(api.support.createTicket, {
                telegramId: "named_user",
                question: "Question from named user",
            });

            await t.mutation(api.support.createTicket, {
                telegramId: "anonymous_user",
                question: "Question from anonymous",
            });

            const allTickets = await t.query(api.support.list, {});

            expect(allTickets).toHaveLength(2);

            const namedTicket = allTickets.find(
                (t) => t.telegramId === "named_user"
            );
            expect(namedTicket?.participantName).toBe("Named User");

            const anonTicket = allTickets.find(
                (t) => t.telegramId === "anonymous_user"
            );
            expect(anonTicket?.participantName).toBeUndefined();
        });

        test("filters by status", async () => {
            const t = setupTest();

            const ticketId1 = await t.mutation(api.support.createTicket, {
                telegramId: uniqueTelegramId(1),
                question: "Open question",
            });

            const ticketId2 = await t.mutation(api.support.createTicket, {
                telegramId: uniqueTelegramId(2),
                question: "Answered question",
            });

            await t.mutation(api.support.answerTicket, {
                ticketId: ticketId2,
                answer: "Here is your answer",
            });

            const openTickets = await t.query(api.support.list, { status: "Open" });
            expect(openTickets).toHaveLength(1);

            const answeredTickets = await t.query(api.support.list, {
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

            const ticketId = await t.mutation(api.support.createTicket, {
                telegramId: "answertest",
                question: "What is the meaning of life?",
            });

            await t.mutation(api.support.answerTicket, {
                ticketId,
                answer: "42",
            });

            const tickets = await t.query(api.support.getMyTickets, {
                telegramId: "answertest",
            });

            expect(tickets[0].answer).toBe("42");
            expect(tickets[0].status).toBe("Answered");
        });

        test("throws on non-existent ticket", async () => {
            const t = setupTest();

            // Create and delete a ticket to get a valid-looking but non-existent ID
            const ticketId = await t.mutation(api.support.createTicket, {
                telegramId: "temp",
                question: "Temp question",
            });

            await t.run(async (ctx) => {
                await ctx.db.delete(ticketId);
            });

            await expect(
                t.mutation(api.support.answerTicket, {
                    ticketId,
                    answer: "This should fail",
                })
            ).rejects.toThrowError("Ticket not found");
        });

        test("throws on empty answer", async () => {
            const t = setupTest();

            const ticketId = await t.mutation(api.support.createTicket, {
                telegramId: "emptyanswertest",
                question: "A question",
            });

            await expect(
                t.mutation(api.support.answerTicket, {
                    ticketId,
                    answer: "",
                })
            ).rejects.toThrowError("Answer cannot be empty");
        });

        test("throws on whitespace-only answer", async () => {
            const t = setupTest();

            const ticketId = await t.mutation(api.support.createTicket, {
                telegramId: "whitespacetest",
                question: "A question",
            });

            await expect(
                t.mutation(api.support.answerTicket, {
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

            const ticketId = await t.mutation(api.support.createTicket, {
                telegramId: "closetest",
                question: "A question to close",
            });

            await t.mutation(api.support.closeTicket, { ticketId });

            const tickets = await t.query(api.support.getMyTickets, {
                telegramId: "closetest",
            });

            expect(tickets[0].status).toBe("Closed");
        });

        test("throws on non-existent ticket", async () => {
            const t = setupTest();

            const ticketId = await t.mutation(api.support.createTicket, {
                telegramId: "temp",
                question: "Temp question",
            });

            await t.run(async (ctx) => {
                await ctx.db.delete(ticketId);
            });

            await expect(
                t.mutation(api.support.closeTicket, { ticketId })
            ).rejects.toThrowError("Ticket not found");
        });

        test("can close an already answered ticket", async () => {
            const t = setupTest();

            const ticketId = await t.mutation(api.support.createTicket, {
                telegramId: "answerthenclose",
                question: "Question",
            });

            await t.mutation(api.support.answerTicket, {
                ticketId,
                answer: "Answer",
            });

            await t.mutation(api.support.closeTicket, { ticketId });

            const tickets = await t.query(api.support.getMyTickets, {
                telegramId: "answerthenclose",
            });

            expect(tickets[0].status).toBe("Closed");
            expect(tickets[0].answer).toBe("Answer");
        });
    });
});
