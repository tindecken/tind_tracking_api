// drizzle/schema.ts
import { sqliteTable, integer, text, real, sqliteView } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// 1️⃣ transaction_person
export const transactionPersonTable = sqliteTable("transaction_person", {
    id: integer("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at").$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

// 2️⃣ wallets
export const walletsTable = sqliteTable("wallets", {
    id: integer("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at").$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

// 4️⃣ months
export const monthsTable = sqliteTable("months", {
    id: integer("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at").$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

// 5️⃣ must_pay_transactions (planned / recurring obligations)
export const mustPayTransactionsTable = sqliteTable("must_pay_transactions", {
    id: integer("id", { mode: "number" }).primaryKey(),
    transactionPersonId: integer("transaction_person_id")
        .notNull()
        .references(() => transactionPersonTable.id),
    monthId: integer("month_id")
        .notNull()
        .references(() => monthsTable.id),
    description: text("description"),
    amount: real("amount").notNull(),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at").$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
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
    mustPayTransactionId: integer("must_pay_transaction_id"),
    date: text("date").notNull(),
    description: text("description"),
    amount: real("amount").notNull(),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at").$onUpdate(() => sql`(CURRENT_TIMESTAMP)`)
});

// 7️⃣ vNhi view - calculates total and remaining amounts for Nhi
export const vNhiView = sqliteView("v_nhi").as((qb) => {
    return qb
        .select({
            totalAmount: sql<number>`
                COALESCE(
                    (SELECT SUM(mpt.amount)
                     FROM must_pay_transactions mpt
                     INNER JOIN transaction_person tp ON mpt.transaction_person_id = tp.id
                     INNER JOIN months m ON mpt.month_id = m.id
                     WHERE tp.name = 'Nhi'
                       AND date('now') BETWEEN date(m.start_date) AND date(m.end_date)
                    ), 0
                )
            `.as('totalAmount'),
            remainingAmount: sql<number>`
                COALESCE(
                    (SELECT SUM(mpt.amount)
                     FROM must_pay_transactions mpt
                     INNER JOIN transaction_person tp ON mpt.transaction_person_id = tp.id
                     INNER JOIN months m ON mpt.month_id = m.id
                     WHERE tp.name = 'Nhi'
                       AND date('now') BETWEEN date(m.start_date) AND date(m.end_date)
                    ), 0
                ) - COALESCE(
                    (SELECT SUM(t.amount)
                     FROM transactions t
                     INNER JOIN transaction_person tp ON t.transaction_person_id = tp.id
                     INNER JOIN months m ON date(t.date) BETWEEN date(m.start_date) AND date(m.end_date)
                     WHERE tp.name = 'Nhi'
                       AND date('now') BETWEEN date(m.start_date) AND date(m.end_date)
                    ), 0
                )
            `.as('remainingAmount')
        })
        .from(transactionPersonTable)
        .where(sql`${transactionPersonTable.name} = 'Nhi'`)
        .limit(1);
});
