import { Request, Response } from "express";
import { processMessageSpeed } from "./speed-game.service";
import logger from "../../utils/logger.utils";

export const checkMessageSpeed = async (req: Request, res: Response) => {
    try {
        const { message } = req.body; // Only extract "message"
        if (!message) return res.status(400).json({ message: "Message is required" });

        const result = await processMessageSpeed(message);
        return res.json(result); // Must return { "message": "modified_message" }
    } catch (error) {
        logger("Error processing speed-game:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
