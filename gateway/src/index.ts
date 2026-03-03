import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import orderRoutes from "./routes/orderRoutes";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/users", userRoutes);
app.use("/orders", orderRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "Gateway Running" });
});

const PORT = process.env.GATEWAY_PORT || 3000;

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});