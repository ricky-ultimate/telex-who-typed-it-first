import { Router } from "express";
import { checkMessageSpeed } from "./speed-game.controller";

const router = Router();

router.post("/", (req, res) => {
    checkMessageSpeed(req, res).catch((error) => {
        console.error("Error handling request:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    });
});

export default router;
