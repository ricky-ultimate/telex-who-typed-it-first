import { ENV } from "../../constants/env";
import axios from "axios";

const messageCache: Map<string, string> = new Map();

export const processMessageSpeed = async (username: string, message: string) => {
    if (messageCache.has(message)) {
        const firstUser = messageCache.get(message);
        await sendSpeedGameResultToTelex(username, firstUser as string, message);
        return `🏆 ${firstUser} typed it first!`;
    }

    messageCache.set(message, username);
    setTimeout(() => messageCache.delete(message), 5000); // Message expires after 5 seconds
    return "Message recorded.";
};

const sendSpeedGameResultToTelex = async (username: string, firstUser: string, message: string) => {
    if (!ENV.TELEX_WEBHOOK_URL) return;

    await axios.post(ENV.TELEX_WEBHOOK_URL, {
        text: `⚡ **Speed Game Alert!**
        Message: "${message}"
        🏆 ${firstUser} typed it first!
        🥈 ${username} was too slow!`
    });
};
