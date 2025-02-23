import { ENV } from "../../constants/env";
import axios from "axios";

let lastMessage = ""; // Stores the last message globally
let lastUser = ""; // Stores the last user globally

export const processMessageSpeed = async (username: string, message: string) => {
    // ✅ Send each message to Telex before checking for a winner
    await sendMessageToTelex(username, message);

    if (message === lastMessage) {
        await sendSpeedGameResultToTelex(lastUser, username, message);
        return { message: `🏆 ${lastUser} typed it first!` };
    }

    // Update the last message & user for the next request
    lastMessage = message;
    lastUser = username;

    return { message: "Message recorded and waiting for competition!" };
};

// ✅ Sends each user's message to Telex immediately
const checkTelexMessageStatus = async (taskId: string): Promise<boolean> => {
    const CHECK_URL = `${ENV.TELEX_WEBHOOK_URL}/status/${taskId}`;

    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const response = await axios.get(CHECK_URL, {
                headers: { "Accept": "application/json" }
            });

            if (response.data.status === "completed") {
                console.log(`✅ Telex processed message successfully.`);
                return true;
            }
        } catch (error) {
            console.error("❌ Error checking Telex message status:", error);
        }

        // Wait for 2 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.warn("⚠️ Telex did not process the message within the expected time.");
    return false;
};

const sendMessageToTelex = async (username: string, message: string) => {
    if (!ENV.TELEX_WEBHOOK_URL) {
        console.warn("⚠️ TELEX_WEBHOOK_URL is missing!");
        return;
    }

    const data = {
        event_name: "speed_game_message",
        message: `💬 **${username}**: "${message}"`,
        status: "info",
        username: "FastBot"
    };

    try {
        const response = await axios.post(ENV.TELEX_WEBHOOK_URL, data, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });

        console.log(`✅ Sent user message from ${username} to Telex. Response:`, response.data);

        if (response.data.task_id) {
            await checkTelexMessageStatus(response.data.task_id);
        }

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("❌ Error sending message to Telex:", error.message);
        } else {
            console.error("❌ An unknown error occurred while sending message to Telex.");
        }
    }
};




// ✅ Sends the winner announcement under "FastBot"
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
        username: "FastBot" // ✅ Now uses "FastBot" instead of the winner's name
    };

    try {
        await axios.post(ENV.TELEX_WEBHOOK_URL, data, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });
        console.log("✅ Sent result to Telex successfully as FastBot.");
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("❌ Error sending result to Telex:", error.message);
        } else {
            console.error("❌ An unknown error occurred while sending result to Telex.");
        }
    }
};
