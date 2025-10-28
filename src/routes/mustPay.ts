import { Hono } from "hono";
import { db } from "../db/index"
import { mustPayTransactionsTable } from "../../drizzle/schema";

export const mustPayRoute = new Hono();

mustPayRoute.get("/", async (c) => {
  const data = await db.select().from(mustPayTransactionsTable);
  return c.json(data);
});

mustPayRoute.post("/", async (c) => {
  const body = await c.req.json();
  const [inserted] = await db
    .insert(mustPayTransactionsTable)
    .values(body)
    .returning();
  return c.json(inserted);
});
