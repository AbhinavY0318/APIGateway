import { Router, Request, Response } from "express";
import { createUser, getUserById } from "../models/user.model";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    const user = await createUser(name, email);

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = await getUserById(Number(req.params.id));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;