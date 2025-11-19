import { Hono } from "hono";
import { addTransactionRoute } from "./routes/transactions/addTransaction";
import { getMonthIdRoute } from "./routes/months/getMonthId";
import { getMustPayTransactionsRoute } from "./routes/mustPayTransactions/getMustPayTransactions";
import { getSummary } from "./routes/transactions/getSummary";
import { addMustPayTransactionsRoute } from "./routes/mustPayTransactions/addMustPayTransaction";
import { updateMustPayTransactionsRoute } from "./routes/mustPayTransactions/updateMustPayTransaction";
import { deleteMustPayTransactionsRoute } from "./routes/mustPayTransactions/deleteMustPayTransaction";
import { addMonthRoute } from "./routes/months/addMonth";
import { deleteMonthRoute } from "./routes/months/deleteMonth";
import { updateMonthRoute } from "./routes/months/updateMonth";
import { deleteTransactionRoute } from "./routes/transactions/deleteTransaction";
import { updateTransactionRoute } from "./routes/transactions/updateTransaction";
import { getTransactionsRoute } from "./routes/transactions/getTransactions";
import { getNhiSummary } from "./routes/transactions/getNhiSummary";
import { reconcilliationTransactionRoute } from "./routes/transactions/reconcilliationTransaction";

const app = new Hono();

app.get("/", (c) => c.text("✅ Tind Tracking API works"));
app.get("/api1", async (c) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return c.text("API 1 worked");
});
app.get("/api2", async (c) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return c.text("API 2 worked");
});
app.get("/api3", async (c) => {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return c.text("API 3 worked");
});
app.get("/api4", async (c) => {
  await new Promise((resolve) => setTimeout(resolve, 4000));
  return c.text("API 4 worked");
});
app.route("/transactions", addTransactionRoute);
app.route("/transactions", getTransactionsRoute);
app.route("/transactions", getSummary);
app.route("/transactions", getNhiSummary);
app.route("/transactions", deleteTransactionRoute);
app.route("/transactions", updateTransactionRoute);
app.route("/transactions", reconcilliationTransactionRoute);
app.route("/months", getMonthIdRoute);
app.route("/months", addMonthRoute);
app.route("/months", deleteMonthRoute);
app.route("/months", updateMonthRoute);
app.route("/mustPayTransactions", getMustPayTransactionsRoute);
app.route("/mustPayTransactions", addMustPayTransactionsRoute);
app.route("/mustPayTransactions", updateMustPayTransactionsRoute);
app.route("/mustPayTransactions", deleteMustPayTransactionsRoute);

const port = Number(process.env.PORT!);

// Start server explicitly for production (PM2)
const server = Bun.serve({
  port: port,
  fetch: app.fetch,
});

console.log(`🚀 Server running on port ${server.port}`);

// Also export for development mode
export default {
  port: port,
  fetch: app.fetch,
};
