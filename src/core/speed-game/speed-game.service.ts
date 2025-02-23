import { ENV } from "../../constants/env";
import axios from "axios";

// ✅ Read values from environment variables
const ORG_ID = ENV.TELEX_ORG_ID;
const CHANNEL_ID = ENV.TELEX_CHANNEL_ID;
const API_URL = `https://ping.telex.im/v1/organisations/${ORG_ID}/channels/${CHANNEL_ID}/messages`;
const POLL_INTERVAL = 5000; // Poll Telex every 5 seconds
const DUPLICATE_TIME_WINDOW = 10000; // 10 seconds

let lastMessages: Record<string, string> = {}; // Stores { message: username }

// ✅ Fetch messages from Telex every 5 seconds
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

        const messages = response.data.messages;
        messages.forEach((msg: any) => processMessage(msg));

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("❌ Error fetching messages from Telex:", error.message);
        } else {
            console.error("❌ Unknown error occurred while fetching messages.");
        }
    }
};

// ✅ Process each new message
const processMessage = async (msg: any) => {
    const username = msg.username || "Unknown"; // Extract username from message
    const messageContent = msg.content.trim();

    console.log(`📩 New Message: ${username}: "${messageContent}"`);

    // ✅ If message is already in memory, declare a winner
    if (lastMessages[messageContent]) {
        const firstUser = lastMessages[messageContent];
        if (firstUser !== username) {
            await sendSpeedGameResultToTelex(firstUser, username, messageContent);
        }
    } else {
        lastMessages[messageContent] = username;

        // ✅ Remove the message after 10 seconds (to allow new rounds)
        setTimeout(() => {
            delete lastMessages[messageContent];
        }, DUPLICATE_TIME_WINDOW);
    }
};

// ✅ Announce the winner in the Telex channel
const sendSpeedGameResultToTelex = async (firstUser: string, secondUser: string, message: string) => {
    if (!ORG_ID || !CHANNEL_ID || !ENV.TELEX_API_TOKEN) {
        console.warn("⚠️ Missing Telex environment variables.");
        return;
    }

    try {
        await axios.post(API_URL,
            { content: `⚡ **Speed Game Alert!**
            Message: "${message}"
            🏆 ${firstUser} typed it first!
            🥈 ${secondUser} was too slow!` },
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

// ✅ Export fetchMessagesFromTelex as processMessageSpeed
export { fetchMessagesFromTelex as processMessageSpeed };
