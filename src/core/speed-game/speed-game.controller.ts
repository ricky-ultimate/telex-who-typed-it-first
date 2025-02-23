import { Request, Response } from "express";
import { processMessageSpeed } from "./speed-game.service";
import logger from "../../utils/logger.utils";

export const checkMessageSpeed = async (req: Request, res: Response) => {
    console.log("🔍 Incoming Telex Request:", JSON.stringify(req.body, null, 2)); // ✅ Log request

    // Try extracting message and username from different possible formats
    const username = req.body.username || req.body.user?.name || req.body.sender;
    const message = req.body.message || req.body.text || req.body.content;

    if (!message || !username) {
        console.warn("⚠️ Missing username or message:", req.body);
        return res.status(400).json({ message: "Username and message are required" });
    }

    const result = await processMessageSpeed(username, message);
    return res.json(result);
};
