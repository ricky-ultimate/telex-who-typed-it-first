import { Request, Response } from "express";
import { processMessageSpeed } from "./speed-game.service";
import logger from "../../uilts/logger.utils";

export const checkMessageSpeed = async (req: Request, res: Response) => {
    try {
        const { username, message } = req.body;
        if (!message || !username) return res.status(400).json({ success: false, message: "Username and message are required" });

        const result = await processMessageSpeed(username, message);
        return res.json({ success: true, response: result });
    } catch (error) {
        logger("Error processing speed-game:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
