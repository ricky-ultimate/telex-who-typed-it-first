### **Who Typed It First? (Speed Game) - Telex Integration**

This integration enables a fun and competitive speed game in Telex, where users race to type a message first. The bot detects duplicate messages and announces the first person who sent it.

---

## **🚀 Features**
- Detects duplicate messages within a **configurable time window** (default: **10 seconds**).
- Announces the first user who typed a message.
- Responds to **all users** who send the duplicate message within the window.
- **FastBot** announces the winner.
- Supports **configurable webhook endpoints** for Telex.
- Includes **error handling** and **retry mechanisms**.

---

## **⚙️ How It Works**
1. A user types a message in Telex.
2. If it's the first occurrence, it gets recorded.
3. If another user sends the **same message** within the **10-second window**, FastBot announces the **first user** who typed it.
4. **All users who send the same message** during this period will receive FastBot’s response.
5. After the window expires, the message resets, allowing a new round to begin.

---

## **📦 API Endpoints**
### **1️⃣ Health Check**
**Endpoint:**
```http
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-02-24T12:00:00.000Z"
}
```

---

### **2️⃣ Process Message**
**Endpoint:**
```http
POST /process-message
```
**Request Body:**
```json
{
  "channel_id": "https://ping.telex.im/v1/webhooks/0195338c-9ee4-7a67-a2d5-4673dbf0cc22",
  "message": "Hello world!",
  "target_url": "https://ping.telex.im/v1/webhooks/0195338c-9ee4-7a67-a2d5-4673dbf0cc22",
  "user_id": "user123",
  "request_id": "req-abc-123"
}
```
**Responses:**
- **First message recorded**
```json
{
  "message": "Hello world!",
  "metadata": {
    "processed": true,
    "user_id": "user123",
    "request_id": "req-abc-123",
    "timestamp": "2025-02-24T12:00:00.000Z"
  }
}
```
- **Duplicate detected (FastBot announces the winner)**
```json
{
  "message": "Hello world!",
  "metadata": {
    "processed": true,
    "user_id": "user456",
    "request_id": "req-def-456",
    "timestamp": "2025-02-24T12:00:05.000Z"
  }
}
```
FastBot then sends:
```json
{
  "channel_id": "https://ping.telex.im/v1/webhooks/0195338c-9ee4-7a67-a2d5-4673dbf0cc22",
  "message": "🏆 user123 typed it first!",
  "event_name": "game_result",
  "status": "success",
  "username": "FastBot"
}
```

---
![Telex Screenshot](assets/image.png)
---

## **🛠️ Configuration**
This integration uses **environment variables** to configure the bot.

| Variable | Description | Default |
|----------|------------|---------|
| `PORT` | Server port | `5000` |
| `TELEX_WEBHOOK_URL` | Webhook URL for sending results to Telex | _Required_ |
| `TELEX_CHANNEL_ID` | Telex Channel ID | _Required_ |
| `TELEX_API_TOKEN` | API Token for authentication | _Required_ |
| `DUPLICATE_TIME_WINDOW` | Time (seconds) before the message resets | `10` |

---

## **📝 Notes**
- The **default time window is 10 seconds** but can be configured.
- **All duplicate messages within the time window get a response** from FastBot.
- If **Telex API fails**, the bot **retries 3 times** before stopping.
- **FastBot always announces the first user** who sent the message.

---

## **🚀 Getting Started**
1. Clone the repository:
   ```sh
   git clone https://github.com/telexintegrations/telex-who-typed-it-first.git
   cd telex-speed-game
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file and configure variables.
4. Start the server:
   ```sh
   npm start
   ```
5. Use **Postman**  to test the `/process-message` endpoint.

---

## **📜 License**
MIT License
This project is open-source and free to use.
