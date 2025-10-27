import { Hono } from "hono";
import { transactionsRoute } from "./routes/transactions";
import { mustPayRoute } from "./routes/mustPay";
import { env } from "./env";

const app = new Hono();

app.get("/", (c) => c.text("✅ Hono + Turso + Drizzle running on Bun!"));
app.route("/transactions", transactionsRoute);
app.route("/must-pay", mustPayRoute);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
