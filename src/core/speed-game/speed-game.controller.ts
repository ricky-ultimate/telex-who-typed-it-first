import { Request, Response } from "express";
import { processMessageSpeed } from "./speed-game.service";
import logger from "../../utils/logger.utils";

export const checkMessageSpeed = async (req: Request, res: Response) => {
    try {
        const { username, message } = req.body; // ✅ Now extracting username too
        if (!message || !username) return res.status(400).json({ message: "Username and message are required" });

        const result = await processMessageSpeed(username, message); // ✅ Passing both username and message

        return res.json(result); // Must return { "message": "modified_message" }
    } catch (error) {
        logger("Error processing speed-game:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
