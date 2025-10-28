import { Hono } from "hono";
import { transactionsRoute } from "./routes/transactions";
import { mustPayRoute } from "./routes/mustPay";
import { getMonthIdRoute } from "./routes/months/getMonthId";
import { env } from "./env";

const app = new Hono();

app.get("/", (c) => c.text("✅ Hono + Turso + Drizzle running on Bun!"));
app.route("/transactions", transactionsRoute);
app.route("/must-pay", mustPayRoute);
app.route("/months", getMonthIdRoute);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
