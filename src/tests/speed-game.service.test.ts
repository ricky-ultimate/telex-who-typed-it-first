import { processMessageSpeed } from "../core/speed-game/speed-game.service";
import axios from "axios";

jest.mock("axios"); // ✅ Mock axios to prevent real HTTP calls

describe("Speed Game Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.TELEX_WEBHOOK_URL = "https://fake.telex.webhook";
    });

    it("should record the first message", async () => {
        const result = await processMessageSpeed("Alice", "Hello World");
        expect(result).toEqual({ message: "Message recorded and waiting for competition!" }); // ✅ Fixed expectation
    });

    it("should detect duplicate messages", async () => {
        await processMessageSpeed("Alice", "Hello World");

        // Mock webhook response to prevent failure
        (axios.post as jest.Mock).mockResolvedValue({ data: "success" });

        const result = await processMessageSpeed("Bob", "Hello World");
        expect(result).toEqual({ message: "🏆 Alice typed it first!" });
    });
});
