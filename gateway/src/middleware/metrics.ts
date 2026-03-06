import { Request, Response, NextFunction } from "express";
import { pool } from "../db/neon";

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", async () => {
    try {
      const latency = Date.now() - start;

      const cacheHit = (req as any).cacheHit || false;
      const rateLimited = res.statusCode === 429;

      await pool.query(
        `INSERT INTO request_logs 
        (route, latency_ms, status_code, cache_hit, rate_limited, logging_mode)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          req.originalUrl,
          latency,
          res.statusCode,
          cacheHit,
          rateLimited,
          process.env.LOGGING_MODE || "sync"
        ]
      );

    } catch (err) {
      console.error("Metrics logging failed:", err);
    }
  });

  next();
};