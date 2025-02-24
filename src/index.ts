import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import axios from "axios";
import integrationData from "./constants/telex-integration.json";
import { ENV } from "./constants/env";
import logger from "./utils/logger.utils";

dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

const PORT = ENV.PORT || 5000;
const lastMessages: Record<string, string> = {};

// ✅ Fix: Ensure Time Window is a number
const DUPLICATE_TIME_WINDOW = Number(
  integrationData.data.settings.find(
    (s) => s.label === "Time Window for Duplicate Detection (seconds)"
  )?.default || 10
);

/**
 * ✅ Health Check Endpoint
 */
app.get("/health", (_req, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * ✅ Serve integration JSON
 */
app.get("/integration.json", (_req, res: Response) => {
  res.json(integrationData);
});

/**
 * ✅ Process Incoming Messages
 */
app.post("/process-message", async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, channel_id, target_url } = req.body;

    if (!message || !channel_id || !target_url) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const username = "User"; // Placeholder (Telex should send username in the future)
    const result = await processMessageSpeed(username, message);

    // Send result back to Telex
    await sendSpeedGameResultToTelex(target_url, channel_id, result.message);

    res.json({
      message: result.message,
      metadata: {
        processed: true,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger("Error processing message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * ✅ Process Message and Determine Who Typed First
 */
const processMessageSpeed = async (username: string, message: string): Promise<{ message: string }> => {
  if (lastMessages[message]) {
    const firstUser = lastMessages[message];

    if (firstUser !== username) {
      return { message: `🏆 ${firstUser} typed it first!` };
    }
  } else {
    lastMessages[message] = username;

    // ✅ Fix: Ensure correct timeout by converting to milliseconds
    setTimeout(() => {
      delete lastMessages[message];
    }, DUPLICATE_TIME_WINDOW * 1000);
  }

  return { message: "Message recorded and waiting for competition!" };
};

/**
 * ✅ Send Result Back to Telex
 */
const sendSpeedGameResultToTelex = async (
  targetUrl: string,
  channelId: string,
  message: string
): Promise<void> => {
  try {
    await axios.post(
      targetUrl,
      { channel_id: channelId, message },
      { headers: { "Content-Type": "application/json" } }
    );

    logger("✅ Winner announcement sent to Telex.");
  } catch (error) {
    logger("❌ Error sending result to Telex:", error);
  }
};

// ✅ Start the Express Server
app.listen(PORT, () => {
  logger(`🚀 Speed Game API running on port ${PORT}`);
});

export default app;
