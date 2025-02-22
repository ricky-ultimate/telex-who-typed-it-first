import { ENV } from "../../constants/env";
import axios from "axios";

const messageCache: Map<string, string> = new Map();

export const processMessageSpeed = async (message: string) => {
    if (messageCache.has(message)) {
        const firstUser = messageCache.get(message);
        await sendSpeedGameResultToTelex(firstUser as string, message);
        return { message: `🏆 ${firstUser} typed it first!` };
    }

    messageCache.set(message, "Unknown User");
    setTimeout(() => messageCache.delete(message), 5000); // Message expires after 5 seconds
    return { message }; // No modification, return as is
};

const sendSpeedGameResultToTelex = async (firstUser: string, message: string) => {
    if (!ENV.TELEX_WEBHOOK_URL) return;

    const data = {
        event_name: "speed_game_result",
        message: `⚡ **Speed Game Alert!**
        Message: "${message}"
        🏆 ${firstUser} typed it first!`,
        status: "success",
        username: firstUser
    };

    try {
        await axios.post(ENV.TELEX_WEBHOOK_URL, data, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error("❌ Error sending result to Telex:", error);
    }
};
