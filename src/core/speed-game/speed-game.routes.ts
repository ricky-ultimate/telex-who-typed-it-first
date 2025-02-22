import { Router } from "express";
import { checkMessageSpeed } from "./speed-game.controller";

const router = Router();

router.post("/", checkMessageSpeed);

export default router;
