import { internalMutation } from "./_generated/server";

export const resetAndSeed = internalMutation({
    args: {},
    handler: async (ctx) => {
        // 1. Clear all data
        console.log("Clearing existing data...");

        const participants = await ctx.db.query("participants").collect();
        for (const doc of participants) await ctx.db.delete(doc._id);

        const groups = await ctx.db.query("groups").collect();
        for (const doc of groups) await ctx.db.delete(doc._id);

        const feedback = await ctx.db.query("feedback").collect();
        for (const doc of feedback) await ctx.db.delete(doc._id);

        const paymentLogs = await ctx.db.query("paymentLogs").collect();
        for (const doc of paymentLogs) await ctx.db.delete(doc._id);

        const supportTickets = await ctx.db.query("supportTickets").collect();
        for (const doc of supportTickets) await ctx.db.delete(doc._id);

        const admins = await ctx.db.query("admins").collect();
        for (const doc of admins) await ctx.db.delete(doc._id);

        console.log("Data cleared.");

        // 2. Seed Participants
        const firstNames = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Hannah", "Ivan", "Judy", "Kevin", "Laura", "Michael", "Nina", "Oscar", "Pam", "Quinn", "Rachel", "Steve", "Tina"];
        const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
        const regions = ["North", "Center", "South"];
        const genders = ["Male", "Female"];
        const statuses = ["Active", "Lead", "Inactive"];

        const participantIds = [];
        console.log("Seeding participants...");

        for (let i = 0; i < 50; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const gender = genders[Math.floor(Math.random() * genders.length)];
            const region = regions[Math.floor(Math.random() * regions.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const age = 20 + Math.floor(Math.random() * 40);

            const participantId = await ctx.db.insert("participants", {
                name: `${firstName} ${lastName}`,
                phone: `+97250${1000000 + i}`,
                telegramId: `tg_${1000 + i}`,
                tgFirstName: firstName,
                tgLastName: lastName,
                // photo: optional
                age: age,
                gender: gender,
                region: region,
                city: "Tel Aviv",
                familyStatus: "Single",
                status: status,
                onPause: Math.random() < 0.1,
                totalPoints: Math.floor(Math.random() * 100),
                registrationDate: Date.now() - Math.floor(Math.random() * 10000000000),
                inChannel: Math.random() > 0.5,
                periodsPaid: Math.floor(Math.random() * 5),

                // Preferences
                targetGender: gender === "Male" ? "Female" : "Male",
                targetAgeFrom: age - 5,
                targetAgeTo: age + 5,
                formatPreference: "In Person",

                // Profile
                profession: "Software Engineer",
                aboutMe: "I love coding and hiking.",
                values: ["Family", "Health"],
                interests: ["Travel", "Cooking"],
            });
            participantIds.push(participantId);
        }

        // 3. Seed Groups
        console.log("Seeding groups...");
        // Create some active groups
        for (let i = 0; i < 10; i++) {
            const p1 = participantIds[Math.floor(Math.random() * participantIds.length)];
            let p2 = participantIds[Math.floor(Math.random() * participantIds.length)];
            while (p1 === p2) {
                p2 = participantIds[Math.floor(Math.random() * participantIds.length)];
            }

            const groupId = await ctx.db.insert("groups", {
                createdAt: Date.now() - Math.floor(Math.random() * 1000000000),
                status: Math.random() > 0.5 ? "Active" : "Completed",
                participant1: p1,
                participant2: p2,
                region: "Center"
            });

            // Add feedback for completed groups
            if (Math.random() > 0.5) {
                await ctx.db.insert("feedback", {
                    groupId: groupId,
                    participantId: p1,
                    rating: 4 + Math.floor(Math.random() * 2),
                    textFeedback: "Great meeting!",
                    wouldMeetAgain: "yes",
                    submittedAt: Date.now(),
                });
            }
        }

        // 4. Seed Support Tickets
        console.log("Seeding support tickets...");
        for (let i = 0; i < 5; i++) {
            await ctx.db.insert("supportTickets", {
                telegramId: `tg_${1000 + i}`,
                question: "How do I update my profile?",
                status: "Open",
                createdAt: Date.now(),
            });
        }

        console.log("Database seeded successfully!");
    },
});
