import { Router, Request, Response } from "express";
import { pool } from "../db/neon";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {

    // total requests
    const totalResult = await pool.query(
      "SELECT COUNT(*) FROM request_logs"
    );

    const totalRequests = parseInt(totalResult.rows[0].count);

    // average latency
    const avgLatencyResult = await pool.query(
      "SELECT AVG(latency_ms) FROM request_logs"
    );

    const avgLatency = parseFloat(avgLatencyResult.rows[0].avg);

    // p95 latency
    const p95Result = await pool.query(
      `
      SELECT percentile_cont(0.95) 
      WITHIN GROUP (ORDER BY latency_ms)
      FROM request_logs
      `
    );

    const p95Latency = parseFloat(p95Result.rows[0].percentile_cont);

    // requests per second
    const rpsResult = await pool.query(`
      SELECT
      COUNT(*) /
      EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))
      AS rps
      FROM request_logs
    `);

    const rps = parseFloat(rpsResult.rows[0].rps);

    res.json({
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

    const avgResult = await pool.query(
      "SELECT AVG(latency_ms) FROM request_logs"
    );

    const p95Result = await pool.query(`
      SELECT percentile_cont(0.95)
      WITHIN GROUP (ORDER BY latency_ms)
      FROM request_logs
    `);

    const rpsResult = await pool.query(`
      SELECT
      COUNT(*) /
      EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))
      AS rps
      FROM request_logs
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
      message: "Metrics snapshot saved",
      avg,
      p95,
      rps
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save metrics" });
  }
});
export default router;