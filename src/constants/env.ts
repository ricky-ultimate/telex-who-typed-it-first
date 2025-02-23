export const ENV = {
    PORT: process.env.PORT ?? 5000,
    TELEX_WEBHOOK_URL: process.env.TELEX_WEBHOOK_URL ?? "",
    TELEX_ORG_ID: process.env.TELEX_ORG_ID ?? "",
    TELEX_CHANNEL_ID: process.env.TELEX_CHANNEL_ID ?? "",
    TELEX_API_TOKEN: process.env.TELEX_API_TOKEN ?? "",
};
