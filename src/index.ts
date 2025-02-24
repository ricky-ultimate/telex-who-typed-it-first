import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import axios, { AxiosError } from "axios";
import integrationData from "./constants/telex-integration.json";
import { ENV } from "./constants/env";
import logger from "./utils/logger.utils";

dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

const PORT = ENV.PORT || 5000;
const lastMessages: Record<string, { first_user: string; timestamp: number; duplicates: Set<string> }> = {};

// ✅ Ensure Time Window is a number
const DUPLICATE_TIME_WINDOW = Number(
  integrationData.data.settings.find(
    (s) => s.label === "Time Window for Duplicate Detection (seconds)"
  )?.default || 10
) * 1000; // Convert to milliseconds

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
    const { message, channel_id, target_url, user_id, request_id } = req.body;

    if (!message || !channel_id || !target_url || !user_id) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const result = await processMessageSpeed(user_id, message);

    // ✅ Send user message to Telex
    await sendUserMessageToTelex(target_url, channel_id, message, user_id, result.event_name);

    // ✅ If duplicate detected, FastBot announces the winner
    if (result.winner_announcement) {
      await sendSpeedGameResultToTelex(target_url, channel_id, result.winner_announcement);
    }

    res.json({
      message: result.message,
      metadata: {
        processed: true,
        user_id,
        request_id: request_id || `req-${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger(`❌ Error processing message: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * ✅ Process Message and Determine Who Typed First
 */
const processMessageSpeed = async (
  user_id: string,
  message: string
): Promise<{ message: string; event_name: string; winner_announcement?: string }> => {
  if (lastMessages[message]) {
    const firstUser = lastMessages[message].first_user;
    lastMessages[message].duplicates.add(user_id);

    if (firstUser !== user_id) {
      return {
        message: message,
        event_name: "duplicate_detected",
        winner_announcement: `🏆 ${firstUser} typed it first!`
      };
    }
  } else {
    lastMessages[message] = { first_user: user_id, timestamp: Date.now(), duplicates: new Set([user_id]) };

    setTimeout(() => {
      delete lastMessages[message];
    }, DUPLICATE_TIME_WINDOW);

    return { message: message, event_name: "message_received" };
  }

  return { message: message, event_name: "message_received" };
};

/**
 * ✅ Send User's Message to Telex
 */
const sendUserMessageToTelex = async (
  targetUrl: string,
  channelId: string,
  message: string,
  user_id: string,
  event_name: string
): Promise<void> => {
  try {
    const payload = {
      channel_id: channelId,
      message: message,
      event_name: event_name,
      status: "success",
      username: user_id
    };

    await axios.post(targetUrl, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000
    });

    logger(`✅ User message (${event_name}) sent to Telex.`);
  } catch (error: unknown) {
    const err = error as AxiosError;
    logger(`❌ Error sending user message to Telex: ${err.message}`);
    if (err.response) {
      logger(`❌ Response Data: ${JSON.stringify(err.response.data)}`);
    }
  }
};

/**
 * ✅ Send Speed Game Result to Telex (FastBot Announcer) with Retry Mechanism
 */
const sendSpeedGameResultToTelex = async (
  targetUrl: string,
  channelId: string,
  winnerMessage: string
): Promise<void> => {
  const payload = {
    channel_id: channelId,
    message: winnerMessage,
    event_name: "game_result",
    status: "success",
    username: "FastBot"
  };

  let attempts = 0;
  while (attempts < 3) {
    try {
      await axios.post(targetUrl, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 5000
      });
      logger("✅ FastBot announced the winner on Telex.");
      return;
    } catch (error: unknown) {
      const err = error as AxiosError;
      attempts++;
      logger(`❌ Attempt ${attempts} failed: ${err.message}`);
      if (err.response) {
        logger(`❌ Response Data: ${JSON.stringify(err.response.data)}`);
      }
      if (attempts >= 3) {
        logger("❌ Final attempt failed. Abandoning webhook call.");
      }
    }
  }
};

// ✅ Start the Express Server
app.listen(PORT, () => {
  logger(`🚀 Speed Game API running on port ${PORT}`);
});

export default app;
