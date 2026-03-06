import { Request, Response, NextFunction } from "express";

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

const CAPACITY = 100;
const REFILL_RATE = 50; // tokens added per second
const MAX_IDLE_TIME = 60 * 1000; // 1 minute

export const rateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const ip = req.ip || "unknown";
  const now = Date.now();

  /*
    CLEANUP STEP

    Over time many IPs may hit the API.
    If we keep every IP forever, the Map can grow very large
    and consume memory.

    So we remove buckets that have not been used for more than
    MAX_IDLE_TIME (1 minute here).

    This keeps the rate limiter memory usage small.
  */

  for (const [storedIp, bucket] of buckets) {
    if (now - bucket.lastRefill > MAX_IDLE_TIME) {
      buckets.delete(storedIp);
    }
  }

  /*
    Get the bucket for this IP.
    If it does not exist, create a new bucket with full tokens.
  */

  let bucket = buckets.get(ip);

  if (!bucket) {
    bucket = {
      tokens: CAPACITY,
      lastRefill: now
    };
    buckets.set(ip, bucket);
  }

  /*
    Calculate how much time passed since the last request
    and refill tokens based on REFILL_RATE.
  */

  const elapsed = (now - bucket.lastRefill) / 1000;

  const refill = elapsed * REFILL_RATE;

  /*
    Add tokens but never exceed bucket capacity.
  */

  bucket.tokens = Math.min(
    CAPACITY,
    bucket.tokens + refill
  );

  bucket.lastRefill = now;

  /*
    If there is at least 1 token available,
    allow the request and consume one token.
  */

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    next();
  } else {

    /*
      No tokens left → request rate is too high.
      Return HTTP 429 (Too Many Requests).
    */

    res.status(429).json({
      error: "Too many requests"
    });
  }
};