import express from "express";
import dotenv from "dotenv";
import orderRoutes from "./routes/orders";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/orders", orderRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "Order Service Running" });
});

const PORT = process.env.ORDER_SERVICE_PORT || 4002;

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});