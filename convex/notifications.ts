import { internalAction } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// TELEGRAM NOTIFICATION ACTIONS
// ============================================

/**
 * Send a message to a Telegram user
 */
export const sendTelegramMessage = internalAction({
    args: {
        chatId: v.string(),
        text: v.string(),
        parseMode: v.optional(v.string()),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (!botToken) {
            console.error("TELEGRAM_BOT_TOKEN not configured");
            return false;
        }

        try {
            const response = await fetch(
                `https://api.telegram.org/bot${botToken}/sendMessage`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: args.chatId,
                        text: args.text,
                        parse_mode: args.parseMode || "HTML",
                    }),
                }
            );

            const data = await response.json();

            if (!data.ok) {
                console.error("Telegram API error:", data);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Failed to send Telegram message:", error);
            return false;
        }
    },
});

/**
 * Send welcome message to new participant
 */
export const sendWelcomeMessage = internalAction({
    args: {
        telegramId: v.string(),
        name: v.string(),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const welcomeText = `🥳 Hooray, ${args.name}! Your profile is accepted!
You're officially in the game! 🚀

What happens next?
⏳ Wait for Sunday. That's when our algorithm forms groups. In the evening you'll get a message with your team and first task!

🎁 Reminder: First week is FREE. Try it, meet people, enjoy!`;

        return await ctx.runAction(
            // @ts-expect-error - internal reference
            "notifications:sendTelegramMessage",
            {
                chatId: args.telegramId,
                text: welcomeText,
            }
        );
    },
});

/**
 * Notify group members about new match
 */
export const notifyGroupMembers = internalAction({
    args: {
        memberTelegramIds: v.array(v.string()),
        memberNames: v.array(v.string()),
        region: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const { memberTelegramIds, memberNames, region } = args;

        const memberList = memberNames.map((name, i) => `${i + 1}. ${name}`).join("\n");

        const message = `🎉 <b>Your group for this week is ready!</b>

📍 Region: ${region}

👥 Your group:
${memberList}

📋 <b>Your task:</b>
Meet up with your group this week and get to know each other!

💡 Tip: Exchange contacts and plan a meeting!

Good luck! 🚀`;

        for (const telegramId of memberTelegramIds) {
            await ctx.runAction(
                // @ts-expect-error - internal reference
                "notifications:sendTelegramMessage",
                {
                    chatId: telegramId,
                    text: message,
                    parseMode: "HTML",
                }
            );
        }

        return null;
    },
});

/**
 * Send feedback request
 */
export const sendFeedbackRequest = internalAction({
    args: {
        telegramId: v.string(),
        groupMemberNames: v.array(v.string()),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const members = args.groupMemberNames.join(", ");

        const message = `📝 <b>How was your meetup?</b>

You met with: ${members}

Please share your feedback - it helps us improve the matching!

Tap the button below to submit your feedback:`;

        // TODO: Add inline keyboard button to open Mini App feedback form

        return await ctx.runAction(
            // @ts-expect-error - internal reference
            "notifications:sendTelegramMessage",
            {
                chatId: args.telegramId,
                text: message,
                parseMode: "HTML",
            }
        );
    },
});
