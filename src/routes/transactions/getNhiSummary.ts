import { Hono } from "hono";
import { getMonthId } from '../../utils/getMonthId';
import type { GenericResponseInterface } from "../../models/GenericResponseInterface";
import { db } from "../../db/index";
import { mustPayTransactionsTable, monthsTable, transactionsTable, transactionPersonTable } from "../../../drizzle/schema";
import { eq, sum, sql, and } from "drizzle-orm";

export const getNhiSummary = new Hono();

getNhiSummary.get("/nhi_summary", async (c) => {
  try {
    // Get the transaction person 'Nhi'
    const nhiPerson = await db
      .select()
      .from(transactionPersonTable)
      .where(eq(transactionPersonTable.name, 'Nhi'))
      .limit(1);

    if (nhiPerson.length === 0) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Transaction person 'Nhi' not found",
        data: null
      };
      return c.json(response, 404);
    }

    // Calculate totalAmount: sum of must_pay_transactions for Nhi in current month
    const totalAmountResult = await db
      .select({
        totalAmount: sum(mustPayTransactionsTable.amount)
      })
      .from(mustPayTransactionsTable)
      .innerJoin(
        transactionPersonTable,
        eq(mustPayTransactionsTable.transactionPersonId, transactionPersonTable.id)
      )
      .innerJoin(
        monthsTable,
        eq(mustPayTransactionsTable.monthId, monthsTable.id)
      )
      .where(
        and(
          eq(transactionPersonTable.name, 'Nhi'),
          sql`date('now') BETWEEN date(${monthsTable.startDate}) AND date(${monthsTable.endDate})`
        )
      );

    const totalAmount = Number(totalAmountResult[0]?.totalAmount || 0);

    // Calculate paid amount: sum of transactions for Nhi in current month
    const paidAmountResult = await db
      .select({
        paidAmount: sum(transactionsTable.amount)
      })
      .from(transactionsTable)
      .innerJoin(
        transactionPersonTable,
        eq(transactionsTable.transactionPersonId, transactionPersonTable.id)
      )
      .innerJoin(
        monthsTable,
        sql`date(${transactionsTable.date}) BETWEEN date(${monthsTable.startDate}) AND date(${monthsTable.endDate})`
      )
      .where(
        and(
          eq(transactionPersonTable.name, 'Nhi'),
          sql`date('now') BETWEEN date(${monthsTable.startDate}) AND date(${monthsTable.endDate})`
        )
      );

    const paidAmount = Number(paidAmountResult[0]?.paidAmount || 0);

    // Calculate remaining amount
    const remainingAmount = totalAmount - paidAmount;

    const response: GenericResponseInterface = {
      success: true,
      message: "Nhi summary retrieved successfully",
      data: {
        totalAmount,
        paidAmount,
        remainingAmount
      }
    };
    return c.json(response);

  } catch (error) {
    console.error('Error getting Nhi summary:', error);
    const response: GenericResponseInterface = {
      success: false,
      message: "Internal server error",
      data: null
    };
    return c.json(response, 500);
  }
});