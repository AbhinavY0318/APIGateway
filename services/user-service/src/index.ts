import express, { Request, Response } from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/users";
import { pool } from "./db/neon";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/users", userRoutes);

app.get("/health", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "User Service Running",
      dbTime: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

const PORT = process.env.USER_SERVICE_PORT || 4001;

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});