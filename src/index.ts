import { Hono } from "hono";
import { addTransactionRoute } from "./routes/transactions/addTransaction";
import { getMonthIdRoute } from "./routes/months/getMonthId";
import { getMustPayTransactionsRoute } from "./routes/mustPayTransactions/getMustPayTransactions";
import { env } from "./env";

const app = new Hono();

app.get("/", (c) => c.text("✅ Tind Tracking API works"));
app.route("/transactions", addTransactionRoute);
app.route("/months", getMonthIdRoute);
app.route("/mustPayTransactions", getMustPayTransactionsRoute);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
