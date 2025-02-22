import express from "express";
import integrationData from "../constants/telex-integration.json";

const router = express.Router();

// Serve the integration JSON
router.get("/", (req, res) => {
    res.json(integrationData);
});

export default router;
