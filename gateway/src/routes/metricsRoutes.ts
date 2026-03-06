import { Router, Request, Response } from "express";
import { pool } from "../db/neon";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {

    // total requests in last 50 logs
    const totalResult = await pool.query(`
      SELECT COUNT(*) FROM (
        SELECT * FROM request_logs
        ORDER BY id DESC
        LIMIT 50
      ) recent
    `);

    const totalRequests = parseInt(totalResult.rows[0].count);

    // average latency of last 50
    const avgLatencyResult = await pool.query(`
      SELECT AVG(latency_ms) FROM (
        SELECT latency_ms FROM request_logs
        ORDER BY id DESC
        LIMIT 50
      ) recent
    `);

    const avgLatency = parseFloat(avgLatencyResult.rows[0].avg);

    // p95 latency of last 50
    const p95Result = await pool.query(`
      SELECT percentile_cont(0.95)
      WITHIN GROUP (ORDER BY latency_ms)
      FROM (
        SELECT latency_ms FROM request_logs
        ORDER BY id DESC
        LIMIT 50
      ) recent
    `);

    const p95Latency = parseFloat(p95Result.rows[0].percentile_cont);

    // RPS for last 50 requests
    const rpsResult = await pool.query(`
      SELECT
      COUNT(*) /
      EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))
      AS rps
      FROM (
        SELECT created_at FROM request_logs
        ORDER BY id DESC
        LIMIT 50
      ) recent
    `);

    const rps = parseFloat(rpsResult.rows[0].rps);

    res.json({
      sample_size: 50,
      total_requests: totalRequests,
      avg_latency_ms: avgLatency,
      p95_latency_ms: p95Latency,
      rps: rps
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to calculate metrics" });
  }
});


router.post("/save", async (req: Request, res: Response) => {
  try {

    const avgResult = await pool.query(`
      SELECT AVG(latency_ms)
      FROM (
        SELECT latency_ms FROM request_logs
        ORDER BY id DESC
        LIMIT 50
      ) recent
    `);

    const p95Result = await pool.query(`
      SELECT percentile_cont(0.95)
      WITHIN GROUP (ORDER BY latency_ms)
      FROM (
        SELECT latency_ms FROM request_logs
        ORDER BY id DESC
        LIMIT 50
      ) recent
    `);

    const rpsResult = await pool.query(`
      SELECT
      COUNT(*) /
      EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))
      AS rps
      FROM (
        SELECT created_at FROM request_logs
        ORDER BY id DESC
        LIMIT 50
      ) recent
    `);

    const avg = avgResult.rows[0].avg;
    const p95 = p95Result.rows[0].percentile_cont;
    const rps = rpsResult.rows[0].rps;

    await pool.query(
      `INSERT INTO metrics_summary
      (logging_mode, avg_latency, p95_latency, rps)
      VALUES ($1,$2,$3,$4)`,
      [
        process.env.LOGGING_MODE,
        avg,
        p95,
        rps
      ]
    );

    res.json({
      message: "Metrics snapshot saved (last 50 requests)",
      avg,
      p95,
      rps
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save metrics" });
  }
});
router.get("/dashboard", async (req: Request, res: Response) => {
  try {

    const result = await pool.query(`
    SELECT
COUNT(*) AS total_requests,

COALESCE(AVG(latency_ms),0) AS avg_latency,

COALESCE(
percentile_cont(0.95)
WITHIN GROUP (ORDER BY latency_ms),0
) AS p95_latency,

COALESCE(
COUNT(*) FILTER (WHERE cache_hit = true) * 100.0 /
NULLIF(COUNT(*),0),0
) AS cache_hit_rate,

COALESCE(
COUNT(*) FILTER (WHERE rate_limited = true) * 100.0 /
NULLIF(COUNT(*),0),0
) AS rate_limited_percentage

FROM request_logs
WHERE created_at >= NOW() - INTERVAL '30 seconds';
    `);

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Dashboard metrics failed" });
  }
});

export default router;