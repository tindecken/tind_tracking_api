import { Hono } from "hono";
import { db } from "../db/index"
import { transactions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const transactionsRoute = new Hono();

// GET /transactions
transactionsRoute.get("/", async (c) => {
  const data = await db.select().from(transactions).limit(50);
  return c.json(data);
});

// GET /transactions/:id
transactionsRoute.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [record] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id));
  if (!record) return c.json({ message: "Not found" }, 404);
  return c.json(record);
});

// POST /transactions
transactionsRoute.post("/", async (c) => {
  const body = await c.req.json();
  const [inserted] = await db.insert(transactions).values(body).returning();
  return c.json(inserted);
});
