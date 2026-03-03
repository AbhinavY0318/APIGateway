import { Router, Request, Response } from "express";
import { proxyRequest } from "../utils/proxy";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const data = await proxyRequest(
      "POST",
      `${process.env.USER_SERVICE_URL}/users`,
      req.body
    );

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: "User service error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const data = await proxyRequest(
      "GET",
      `${process.env.USER_SERVICE_URL}/users/${req.params.id}`
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "User service error" });
  }
});

export default router;