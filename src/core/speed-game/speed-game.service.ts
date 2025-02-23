import { ENV } from "../../constants/env";
import axios from "axios";

// ✅ Read values from environment variables
const ORG_ID = ENV.TELEX_ORG_ID;
const CHANNEL_ID = ENV.TELEX_CHANNEL_ID;
const API_URL = `https://api.telex.im/api/v1/channels/${CHANNEL_ID}/messages`;
const WEBHOOK_URL = ENV.TELEX_WEBHOOK_URL;
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
        // ✅ Ensure we're fetching up to 50 messages
        const response = await axios.get(`${API_URL}?limit=50`, {
            headers: {
                Authorization: `Bearer ${ENV.TELEX_API_TOKEN}`,
                Accept: "application/json",
            },
        });

        console.log("🔍 Full API Response:", response.data); // Log full response

        // ✅ Fix: Use `data.messages`, handling null case
        const messages = response.data?.data?.messages || [];

        if (!messages.length) {
            console.warn("⚠️ No messages found in Telex channel.");
            return;
        }

        messages.forEach((msg: any) => processMessage(msg));
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error("❌ Telex API Error:", {
                status: error.response.status,
                data: error.response.data,
            });
        } else if (error instanceof Error) {
            console.error("❌ Unexpected error:", error.message);
        } else {
            console.error("❌ Unknown error occurred while fetching messages.");
        }
    }
};

// ✅ Process each new message from Telex
const processMessage = async (msg: any) => {
    const username = msg.username || "Unknown";
    const messageContent = msg.content?.trim() || "";

    if (!messageContent) return;

    console.log(`📩 New Message from Telex: ${username}: "${messageContent}"`);

    await processMessageSpeed(username, messageContent);
};

// ✅ Announce the winner in the Telex channel via Webhook
const sendSpeedGameResultToTelex = async (firstUser: string, secondUser: string, message: string) => {
    if (!WEBHOOK_URL || !CHANNEL_ID) {
        console.warn("⚠️ Missing Telex webhook URL or channel ID.");
        return;
    }

    try {
        await axios.post(WEBHOOK_URL, {
            channel_id: CHANNEL_ID,
            message: `⚡ **Speed Game Alert!**\nMessage: "${message}"\n🏆 ${firstUser} typed it first!\n🥈 ${secondUser} was too slow!`
        }, {
            headers: {
                Authorization: `Bearer ${ENV.TELEX_API_TOKEN}`,
                "Content-Type": "application/json",
            },
        });

        console.log("✅ Sent result to Telex successfully.");
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error("❌ Telex API Error:", {
                status: error.response.status,
                data: error.response.data,
            });
        } else if (error instanceof Error) {
            console.error("❌ Unexpected error:", error.message);
        } else {
            console.error("❌ Unknown error occurred while sending result.");
        }
    }
};

// ✅ Start polling Telex for new messages
setInterval(fetchMessagesFromTelex, POLL_INTERVAL);
