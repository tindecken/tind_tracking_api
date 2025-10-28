// drizzle/schema.ts
import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// 1️⃣ transaction_person
export const transactionPersonTable = sqliteTable("transaction_person", {
    id: integer("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
});

// 2️⃣ wallets
export const walletsTable = sqliteTable("wallets", {
    id: integer("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
});

// 4️⃣ months
export const monthsTable = sqliteTable("months", {
    id: integer("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
});

// 5️⃣ must_pay_transactions (planned / recurring obligations)
export const mustPayTransactionsTable = sqliteTable("must_pay_transactions", {
    id: integer("id", { mode: "number" }).primaryKey(),
    transactionPersonId: integer("transaction_person_id")
        .notNull()
        .references(() => transactionPersonTable.id),
    walletId: integer("wallet_id")
        .notNull()
        .references(() => walletsTable.id),
    monthId: integer("month_id")
        .notNull()
        .references(() => monthsTable.id),
    description: text("description"),
    amount: real("amount").notNull(),
    createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at"),
});

// 6️⃣ transactions (actual payments)
export const transactionsTable = sqliteTable("transactions", {
    id: integer("id", { mode: "number" }).primaryKey(),
    transactionPersonId: integer("transaction_person_id")
        .notNull()
        .references(() => transactionPersonTable.id),
    walletId: integer("wallet_id")
        .notNull()
        .references(() => walletsTable.id),
    mustPayTransactionId: integer("must_pay_transaction_id").references(
        () => mustPayTransactionsTable.id
    ),
    transactionDate: text("transaction_date").notNull(),
    description: text("description"),
    amount: real("amount").notNull(),
    isPayByCash: integer("is_pay_by_cash", { mode: "boolean" })
        .notNull()
        .default(false),
    createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});
