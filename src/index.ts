import { Hono } from "hono";
import { addTransactionRoute } from "./routes/transactions/addTransaction";
import { getMonthIdRoute } from "./routes/months/getMonthId";
import { getMustPayTransactionsRoute } from "./routes/mustPayTransactions/getMustPayTransactions";
import { getSummary } from "./routes/transactions/getSummary";
import { env } from "./env";
import { addMustPayTransactionsRoute } from "./routes/mustPayTransactions/addMustPayTransaction";
import { updateMustPayTransactionsRoute } from "./routes/mustPayTransactions/updateMustPayTransaction";
import { deleteMustPayTransactionsRoute } from "./routes/mustPayTransactions/deleteMustPayTransaction";
import { addMonthRoute } from "./routes/months/addMonth";
import { deleteMonthRoute } from "./routes/months/deleteMonth";
import { updateMonthRoute } from "./routes/months/updateMonth";
import { deleteTransactionRoute } from "./routes/transactions/deleteTransaction";
import { updateTransactionRoute } from "./routes/transactions/updateTransaction";
import { getTransactionsRoute } from "./routes/transactions/getTransactions";

const app = new Hono();

app.get("/", (c) => c.text("✅ Tind Tracking API works"));
app.route("/transactions", addTransactionRoute);
app.route("/transactions", getTransactionsRoute);
app.route("/transactions", getSummary);
app.route("/transactions", deleteTransactionRoute);
app.route("/transactions", updateTransactionRoute);
app.route("/months", getMonthIdRoute);
app.route("/months", addMonthRoute);
app.route("/months", deleteMonthRoute);
app.route("/months", updateMonthRoute);
app.route("/mustPayTransactions", getMustPayTransactionsRoute);
app.route("/mustPayTransactions", addMustPayTransactionsRoute);
app.route("/mustPayTransactions", updateMustPayTransactionsRoute);
app.route("/mustPayTransactions", deleteMustPayTransactionsRoute);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
