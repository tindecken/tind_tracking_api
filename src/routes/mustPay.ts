import { Hono } from "hono";
import { db } from "../db/index"
import { mustPayTransactions } from "../../drizzle/schema";

export const mustPayRoute = new Hono();

mustPayRoute.get("/", async (c) => {
  const data = await db.select().from(mustPayTransactions);
  return c.json(data);
});

mustPayRoute.post("/", async (c) => {
  const body = await c.req.json();
  const [inserted] = await db
    .insert(mustPayTransactions)
    .values(body)
    .returning();
  return c.json(inserted);
});
