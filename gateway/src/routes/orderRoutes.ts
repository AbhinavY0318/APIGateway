import { Router, Request, Response } from "express";
import { proxyRequest } from "../utils/proxy";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const data = await proxyRequest(
      "POST",
      `${process.env.ORDER_SERVICE_PORT}/orders`,
      req.body
    );

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: "Order service error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const data = await proxyRequest(
      "GET",
      `${process.env.ORDER_SERVICE_URL}/orders/${req.params.id}`
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Order service error" });
  }
});

export default router;