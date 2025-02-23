import request from "supertest";
import app from "../src/index"; // Ensure your `index.ts` exports `app`

describe("Speed Game API", () => {
  it("should return 400 if message is missing", async () => {
    const res = await request(app).post("/api/speed-game").send({});
    expect(res.status).toBe(400);
  });

  it("should process a valid message", async () => {
    const res = await request(app)
      .post("/api/speed-game")
      .send({ username: "Alice", message: "Hello World" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
  });
});
