import { Router, Request, Response } from "express";
import { proxyRequest } from "../utils/proxy";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const url = `${process.env.USER_SERVICE_PORT}/users`;

    console.log("Gateway forwarding request to:", url);
    console.log("Request body:", req.body);

    const data = await proxyRequest(
      "POST",
      url,
      req.body
    );

    console.log("Response from user-service:", data);

    res.status(201).json(data);

  } catch (err: any) {

    console.log("Gateway error occurred");
    console.log("Error message:", err.message);
    console.log("Error response:", err.response?.data);

    res.status(500).json({
      error: "User service error"
    });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const data = await proxyRequest(
      "GET",
      `${process.env.USER_SERVICE_PORT}/users/${req.params.id}`
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "User service error" });
  }
});

export default router;