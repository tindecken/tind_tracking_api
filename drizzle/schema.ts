// drizzle/schema.ts
import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// 1️⃣ transaction_person
export const transactionPerson = sqliteTable("transaction_person", {
    id: integer("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
});

// 2️⃣ wallets
export const wallets = sqliteTable("wallets", {
    id: integer("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
});

// 3️⃣ transaction_types
export const transactionTypes = sqliteTable("transaction_types", {
    id: integer("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
});

// 4️⃣ months
export const months = sqliteTable("months", {
    id: integer("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
});

// 5️⃣ must_pay_transactions (planned / recurring obligations)
export const mustPayTransactions = sqliteTable("must_pay_transactions", {
    id: integer("id", { mode: "number" }).primaryKey(),
    transactionPersonId: integer("transaction_person_id")
        .notNull()
        .references(() => transactionPerson.id),
    walletId: integer("wallet_id")
        .notNull()
        .references(() => wallets.id),
    transactionTypeId: integer("transaction_type_id")
        .notNull()
        .references(() => transactionTypes.id),
    monthId: integer("month_id")
        .notNull()
        .references(() => months.id),
    description: text("description"),
    amount: real("amount").notNull(),
    createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at"),
});

// 6️⃣ transactions (actual payments)
export const transactions = sqliteTable("transactions", {
    id: integer("id", { mode: "number" }).primaryKey(),
    transactionPersonId: integer("transaction_person_id")
        .notNull()
        .references(() => transactionPerson.id),
    walletId: integer("wallet_id")
        .notNull()
        .references(() => wallets.id),
    transactionTypeId: integer("transaction_type_id")
        .notNull()
        .references(() => transactionTypes.id),
    mustPayTransactionId: integer("must_pay_transaction_id").references(
        () => mustPayTransactions.id
    ),
    transactionDate: text("transaction_date").notNull(),
    description: text("description"),
    amount: real("amount").notNull(),
    isPayByCash: integer("is_pay_by_cash", { mode: "boolean" })
        .notNull()
        .default(false),
    createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});
