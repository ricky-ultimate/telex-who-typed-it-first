import { ENV } from "../../constants/env";
import axios from "axios";

let lastMessage = ""; // Stores the last message globally
let lastUser = ""; // Stores the last user globally

export const processMessageSpeed = async (username: string, message: string) => {
    if (message === lastMessage) {
        await sendSpeedGameResultToTelex(lastUser, username, message);
        return { message: `🏆 ${lastUser} typed it first!` };
    }

    // Update the last message & user for the next request
    lastMessage = message;
    lastUser = username;

    return { message: "Message recorded and waiting for competition!" };
};

const sendSpeedGameResultToTelex = async (firstUser: string, secondUser: string, message: string) => {
    if (!ENV.TELEX_WEBHOOK_URL) {
        console.warn("⚠️ TELEX_WEBHOOK_URL is missing!");
        return;
    }

    const data = {
        event_name: "speed_game_result",
        message: `⚡ **Speed Game Alert!**
        Message: "${message}"
        🏆 ${firstUser} typed it first!
        🥈 ${secondUser} was too slow!`,
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
        console.log("✅ Sent result to Telex successfully.");
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("❌ Error sending result to Telex:", error.message);
        } else {
            console.error("❌ An unknown error occurred while sending result to Telex.");
        }
    }
};
