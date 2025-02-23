import { ENV } from "../../constants/env";
import axios from "axios";

// ✅ Read values from environment variables
const CHANNEL_ID = ENV.TELEX_CHANNEL_ID;
const API_URL = `https://api.telex.im/api/v1/${CHANNEL_ID}/messages`;
const WEBHOOK_URL = ENV.TELEX_WEBHOOK_URL;
const POLL_INTERVAL = 5000; // Poll Telex every 5 seconds
const DUPLICATE_TIME_WINDOW = 10000; // 10 seconds

let lastMessages: Record<string, string> = {}; // Stores { message: username }

// ✅ Function to process incoming messages
const processMessage = async (msg: any) => {
    const username = msg.username || "Unknown";
    const messageContent = msg.content?.trim() || "";

    if (!messageContent) return; // Ignore empty messages

    console.log(`📩 New Message: ${username}: "${messageContent}"`);

    await processMessageSpeed(username, messageContent);
};

// ✅ Fetch messages from Telex API every 5 seconds
const fetchMessagesFromTelex = async () => {
    if (!CHANNEL_ID || !ENV.TELEX_API_TOKEN) {
        console.warn("⚠️ Missing Telex environment variables.");
        return;
    }

    try {
        const response = await axios.get(`${API_URL}?limit=50`, {
            headers: {
                Authorization: `Bearer ${ENV.TELEX_API_TOKEN}`,
                Accept: "application/json",
            },
        });

        console.log("🔍 Full API Response:", response.data); // Debugging logs

        const messages = response.data?.data?.messages || []; // ✅ Handles null case properly

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

// ✅ Process each message and determine the winner
export const processMessageSpeed = async (username: string, message: string) => {
    console.log(`📩 Processing message from ${username}: "${message}"`);

    // ✅ If message exists, declare a winner
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

        console.log("✅ Winner announcement sent to Telex.");
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
