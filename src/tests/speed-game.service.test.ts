import { processMessageSpeed } from "../core/speed-game/speed-game.service";
import axios from "axios";
import { ENV } from "../constants/env";

jest.mock("axios"); // ✅ Mock axios requests

describe("Speed Game Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ENV.TELEX_WEBHOOK_URL = "https://fake.telex.webhook"; // ✅ Mock environment variable
  });

  it("should record the first message", async () => {
    const result = await processMessageSpeed("Alice", "Hello World");
    expect(result).toEqual({
      message: "Message recorded and waiting for competition!",
    });
  });

  it("should detect duplicate messages", async () => {
    await processMessageSpeed("Alice", "Hello World");

    // ✅ Mock successful webhook response
    (axios.post as jest.Mock).mockResolvedValue({ data: "success" });

    const result = await processMessageSpeed("Bob", "Hello World");
    expect(result).toEqual({ message: "🏆 Alice typed it first!" });
  });

  it("should handle errors when sending webhook", async () => {
    await processMessageSpeed("Alice", "Hello World");

    // ✅ Mock webhook failure
    (axios.post as jest.Mock).mockRejectedValue(new Error("Webhook failed"));

    const result = await processMessageSpeed("Bob", "Hello World");

    expect(result).toEqual({ message: "🏆 Alice typed it first!" });
  });
});
