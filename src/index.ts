import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { ENV } from "./constants/env";
import logger from "./utils/logger.utils";
import speedGameRoutes from "./core/speed-game/speed-game.routes";
import integrationRoutes from "./routes/integration.routes";


dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

app.use("/api/speed-game", speedGameRoutes);
app.use("/api/integration", integrationRoutes);

if (process.env.NODE_ENV !== "test") {
    app.listen(ENV.PORT, () => {
        logger(`🚀 Server running on port ${ENV.PORT}!`);
    });
}

export default app;
