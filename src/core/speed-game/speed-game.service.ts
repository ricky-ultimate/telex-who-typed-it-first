import { ENV } from "../../constants/env";
import axios from "axios";

let lastMessage = "";
let lastUser = "";
let resetTimer: NodeJS.Timeout | null = null;

export const processMessageSpeed = async (username: string, message: string) => {
    await sendMessageToTelex(username, message); // ✅ Send every message to Telex

    if (message === lastMessage) {
        await sendSpeedGameResultToTelex(lastUser, username, message);

        // ✅ Reset stored message after five seconds to allow new competitions
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
            lastMessage = "";
            lastUser = "";
        }, 10000);

        return { message: `🏆 ${lastUser} typed it first!` };
    }

    // ✅ Record new message & user, wait for competitors
    lastMessage = message;
    lastUser = username;

    // ✅ Start reset timer to clear message after five seconds
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
        lastMessage = "";
        lastUser = "";
    }, 5000);

    return { message: "Message recorded and waiting for competition!" };
};

const sendMessageToTelex = async (username: string, message: string) => {
    if (!ENV.TELEX_WEBHOOK_URL) return;

    const data = {
        event_name: "speed_game_message",
        message: `💬 **${username}**: "${message}"`,
        status: "info",
        username: "FastBot"
    };

    try {
        await axios.post(ENV.TELEX_WEBHOOK_URL, data, {
            headers: { "Accept": "application/json", "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("❌ Error sending message to Telex:", error instanceof Error ? error.message : error);
    }
};

const sendSpeedGameResultToTelex = async (firstUser: string, secondUser: string, message: string) => {
    if (!ENV.TELEX_WEBHOOK_URL) return;

    const data = {
        event_name: "speed_game_result",
        message: `⚡ **Speed Game Alert!**
        Message: "${message}"
        🏆 ${firstUser} typed it first!
        🥈 ${secondUser} was too slow!`,
        status: "success",
        username: "FastBot"
    };

    try {
        await axios.post(ENV.TELEX_WEBHOOK_URL, data, {
            headers: { "Accept": "application/json", "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("❌ Error sending result to Telex:", error instanceof Error ? error.message : error);
    }
};
