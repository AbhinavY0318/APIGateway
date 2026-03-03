import { Router, Request, Response } from "express";
import {
  createOrder,
  getOrderById,
  getOrdersByUserId
} from "../models/order.model";

const router = Router();

// Create Order
router.post("/", async (req: Request, res: Response) => {
  try {
    const { user_id, amount } = req.body;

    if (!user_id || !amount) {
      return res.status(400).json({
        error: "user_id and amount are required"
      });
    }

    const order = await createOrder(
      Number(user_id),
      Number(amount)
    );

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Get Order by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const order = await getOrderById(Number(req.params.id));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Get Orders by User ID
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const orders = await getOrdersByUserId(Number(req.params.userId));

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
});

export default router;