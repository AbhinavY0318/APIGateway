import { pool } from "../db/neon";

export const createOrder = async (userId: number, amount: number) => {
  const result = await pool.query(
    "INSERT INTO orders (user_id, amount) VALUES ($1, $2) RETURNING *",
    [userId, amount]
  );

  return result.rows[0];
};

export const getOrderById = async (id: number) => {
  const result = await pool.query(
    "SELECT * FROM orders WHERE id = $1",
    [id]
  );

  return result.rows[0];
};

export const getOrdersByUserId = async (userId: number) => {
  const result = await pool.query(
    "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );

  return result.rows;
};