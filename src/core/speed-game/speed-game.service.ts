import { ENV } from "../../constants/env";
import axios from "axios";

const messageCache: Map<string, string> = new Map();

export const processMessageSpeed = async (username: string, message: string) => {
    if (messageCache.has(message)) {
        const firstUser = messageCache.get(message);
        await sendSpeedGameResultToTelex(firstUser as string, message);
        return { message: `🏆 ${firstUser} typed it first!` };
    }

    messageCache.set(message, username); // ✅ Now storing the actual username
    setTimeout(() => messageCache.delete(message), 5000);
    return { message };
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
