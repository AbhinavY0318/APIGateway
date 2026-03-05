import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import orderRoutes from "./routes/orderRoutes";
import metricsRoutes from "./routes/metricsRoutes"
import { metricsMiddleware } from "./middleware/metrics";
dotenv.config();

const app = express();
app.use(express.json());
app.use(metricsMiddleware);
app.use("/users", userRoutes);
app.use("/orders", orderRoutes);
app.use("/metrics", metricsRoutes);
app.get("/health", (req, res) => {
  res.json({ status: "Gateway Running" });
});

const PORT = process.env.GATEWAY_PORT || 3000;

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});