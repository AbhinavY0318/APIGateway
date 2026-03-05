import { Request, Response, NextFunction } from "express";
import { pool } from "../db/neon";

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", async () => {
    try {
      const latency = Date.now() - start;

      await pool.query(
        `INSERT INTO request_logs 
        (route, latency_ms, status_code, cache_hit, rate_limited, logging_mode)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          req.originalUrl,
          latency,
          res.statusCode,
          false, // cache_hit (will implement later)
          false, // rate_limited (later)
          process.env.LOGGING_MODE || "sync"
        ]
      );

    } catch (err) {
      console.error("Metrics logging failed:", err);
    }
  });

  next();
};