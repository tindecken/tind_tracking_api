import { Hono } from "hono";
import { cors } from "hono/cors";
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
import { last5Transactions } from "./routes/spreadsheet/last5Transactions";
import { lastTransaction } from "./routes/spreadsheet/lastTransaction";
import { nhiRemaining } from "./routes/spreadsheet/nhiRemaining";
import { addTransaction } from "./routes/spreadsheet/addTransaction";
import { perDay } from "./routes/spreadsheet/perDay";
import { undoTransaction } from "./routes/spreadsheet/undoTransaction";
import { getMustPay } from "./routes/spreadsheet/getMustPay";
import { getHoangRemaining } from "./routes/spreadsheet/getHoangRemaining";

const app = new Hono();

app.use("*", cors({
  origin: ['http://tindecken.xyz', 'https://tindecken.xyz', 'http://localhost', 'https://localhost:1000', 'http://localhost:1000', 'http://localhost:3001', 'https://paperwork.tindecken.xyz', 'https://paperworkapi.tindecken.xyz', 'https://192.168.1.99:9090', 'http://192.168.1.99:9090', 'capacitor://192.168.1.99:9090', 'capacitor://192.168.1.99', 'https://192.168.1.3:9090', 'https://192.168.1.3:1000', 'https://10.10.0.27:1000', 'https://10.10.0.27:3001', 'http://localhost:9000', 'https://d.tindecken.xyz'],
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
	credentials: true,
	exposeHeaders: ['Content-Length', 'X-Kuma-Revision', 'X-Retry-After'],
	maxAge: 10 * 60
}))

app.get("/", (c) => c.text("✅ Tind Tracking API works"));
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
app.route("/spreadsheet", addTransaction);
app.route("/spreadsheet", last5Transactions);
app.route("/spreadsheet", lastTransaction);
app.route("/spreadsheet", nhiRemaining);
app.route("/spreadsheet", getHoangRemaining);
app.route("/spreadsheet", perDay);
app.route("/spreadsheet", undoTransaction);
app.route("/spreadsheet", getMustPay);


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
