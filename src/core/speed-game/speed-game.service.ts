import { ENV } from "../../constants/env";
import axios from "axios";

// ✅ Read values from environment variables
const ORG_ID = ENV.TELEX_ORG_ID;
const CHANNEL_ID = ENV.TELEX_CHANNEL_ID;
const API_URL = `https://api.telex.im/v1/channels/${CHANNEL_ID}/messages`;
const POLL_INTERVAL = 5000; // Poll Telex every 5 seconds
const DUPLICATE_TIME_WINDOW = 10000; // 10 seconds

let lastMessages: Record<string, string> = {}; // Stores { message: username }

// ✅ Function to process speed-game messages manually
export const processMessageSpeed = async (username: string, message: string) => {
    console.log(`📩 Processing message from ${username}: "${message}"`);

    // ✅ If message is already in memory, declare a winner
    if (lastMessages[message]) {
        const firstUser = lastMessages[message];
        if (firstUser !== username) {
            await sendSpeedGameResultToTelex(firstUser, username, message);
            return { message: `🏆 ${firstUser} typed it first!` };
        }
    } else {
        lastMessages[message] = username;

        // ✅ Remove message after time window to allow new rounds
        setTimeout(() => {
            delete lastMessages[message];
        }, DUPLICATE_TIME_WINDOW);
    }

    return { message: "Message recorded and waiting for competition!" };
};

// ✅ Function to fetch messages from Telex every 5 seconds
const fetchMessagesFromTelex = async () => {
    if (!ORG_ID || !CHANNEL_ID || !ENV.TELEX_API_TOKEN) {
        console.warn("⚠️ Missing Telex environment variables.");
        return;
    }

    try {
        const response = await axios.get(API_URL, {
            headers: {
                Authorization: `Bearer ${ENV.TELEX_API_TOKEN}`,
                Accept: "application/json",
            },
        });

        console.log("🔍 Full API Response:", response.data); // Log full response

        const messages = response.data?.messages; // ✅ Adjust to match API response

        if (!messages || !Array.isArray(messages)) {
            console.warn("⚠️ No messages found or incorrect format.");
            return;
        }

        messages.forEach((msg: any) => processMessage(msg));

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("❌ Error fetching messages from Telex:", error.message);
        } else {
            console.error("❌ Unknown error occurred while fetching messages.");
        }
    }
};



// ✅ Process each new message from Telex
const processMessage = async (msg: any) => {
    const username = msg.username || "Unknown"; // Extract username
    const messageContent = msg.content.trim();

    console.log(`📩 New Message from Telex: ${username}: "${messageContent}"`);

    await processMessageSpeed(username, messageContent);
};

// ✅ Announce the winner in the Telex channel
const sendSpeedGameResultToTelex = async (firstUser: string, secondUser: string, message: string) => {
    if (!ORG_ID || !CHANNEL_ID || !ENV.TELEX_API_TOKEN) {
        console.warn("⚠️ Missing Telex environment variables.");
        return;
    }

    try {
        await axios.post(API_URL,
            { content: `⚡ **Speed Game Alert!**\nMessage: "${message}"\n🏆 ${firstUser} typed it first!\n🥈 ${secondUser} was too slow!` },
            {
                headers: {
                    Authorization: `Bearer ${ENV.TELEX_API_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("✅ Sent result to Telex successfully.");
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("❌ Error sending result to Telex:", error.message);
        } else {
            console.error("❌ Unknown error occurred while sending result.");
        }
    }
};

// ✅ Start polling Telex for new messages
setInterval(fetchMessagesFromTelex, POLL_INTERVAL);
