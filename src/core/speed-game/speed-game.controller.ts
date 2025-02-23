import { Request, Response } from "express";
import { processMessageSpeed } from "./speed-game.service";
import logger from "../../utils/logger.utils";

export const checkMessageSpeed = async (req: Request, res: Response) => {
    console.log("🔍 Incoming Telex Request:", JSON.stringify(req.body, null, 2)); // ✅ Log entire request from Telex

    const { username, message } = req.body; // Extracting expected data
    if (!message || !username) {
        console.warn("⚠️ Missing username or message:", req.body);
        return res.status(400).json({ message: "Username and message are required" });
    }

    const result = await processMessageSpeed(username, message);
    return res.json(result);
};
