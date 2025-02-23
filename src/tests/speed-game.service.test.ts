import { processMessageSpeed } from "../src/core/speed-game/speed-game.service";

describe("Speed Game Service", () => {
  it("should record the first message", async () => {
    const result = await processMessageSpeed("Alice", "Hello World");
    expect(result).toEqual({ message: "Message recorded." });
  });

  it("should detect duplicate messages", async () => {
    await processMessageSpeed("Alice", "Hello World");
    const result = await processMessageSpeed("Bob", "Hello World");
    expect(result).toEqual({ message: "🏆 Alice typed it first!" });
  });
});
