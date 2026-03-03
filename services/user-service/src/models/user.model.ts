import { pool } from "../db/neon";

export const createUser = async (name: string, email: string) => {
  const result = await pool.query(
    "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
    [name, email]
  );

  return result.rows[0];
};

export const getUserById = async (id: number) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );

  return result.rows[0];
};