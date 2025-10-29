import { Hono } from "hono";
import { getMonthId } from '../../utils/getMonthId';
import type { GenericResponseInterface } from "../../models/GenericResponseInterface";
import { db } from "../../db/index";
import { mustPayTransactionsTable, monthsTable, transactionsTable, transactionPersonTable, walletsTable } from "../../../drizzle/schema";
import { eq, sum, sql, and } from "drizzle-orm";

export const getSummary = new Hono();

getSummary.get("/summary", async (c) => {
  try {
    // Set date = today in UTC+7 timezone
    const today: string = new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0]!; // YYYY-MM-DD format in UTC+7

    // Get month record and monthId from table monthsTable
    const monthId = await getMonthId(today);
    if (monthId === -1) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Month not found",
        data: null
      };
      return c.json(response, 404);
    }

    // Get month record to access end_date
    const monthRecord = await db
      .select()
      .from(monthsTable)
      .where(eq(monthsTable.id, monthId))
      .limit(1);

    if (!monthRecord[0]) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Month record not found",
        data: null
      };
      return c.json(response, 404);
    }

    const month = monthRecord[0];

    // Get transactionPersonTable
    const myTransactionPerson = await db
      .select()
      .from(transactionPersonTable)
      .where(eq(transactionPersonTable.name, 'Me'))
      .limit(1);

    if (myTransactionPerson.length === 0) {
      const response: GenericResponseInterface = {
        success: false,
        message: "transactionPerson not found",
        data: null
      };
      return c.json(response, 404);
    }


    // Get year and month from end_date
    const endDate = new Date(month.endDate!);
    const year = endDate.getFullYear();
    const monthNum = endDate.getMonth() + 1; // getMonth() returns 0-11, so add 1

    // Get end of month
    const endOfMonth = new Date(year, monthNum, 0); // Last day of the month

    // Get lastPeriodDate by adding 6 days to end of month
    const lastPeriodDate = new Date(endOfMonth);
    lastPeriodDate.setDate(lastPeriodDate.getDate() + 6);

    // Get dayLeft = lastPeriodDate - today (number of days diff)
    const todayDate = new Date(today);
    const dayLeft = Math.ceil((lastPeriodDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    // Query transactions table with date between start_date and end_date of month record
    const transactionsResult = await db
      .select({
        totalAmount: sum(transactionsTable.amount)
      })
      .from(transactionsTable)
      .where(
        and(
          sql`date(${transactionsTable.date}) BETWEEN date(${month.startDate}) AND date(${month.endDate})`,
          eq(transactionsTable.transactionPersonId, myTransactionPerson[0]!.id)
        )
      );

    const totalAmount = Number(transactionsResult[0]?.totalAmount || 0);
    console.log("totalAmount", totalAmount);

    // Get cashAmount & bankAmount
    const cashWallet = await db.select().from(walletsTable).where(eq(walletsTable.name, 'Cash')).limit(1);
    const bankWallet = await db.select().from(walletsTable).where(eq(walletsTable.name, 'Bank')).limit(1);
    const cashTransaction = await db
      .select({
        cashAmount: sum(transactionsTable.amount)
      })
      .from(transactionsTable)
      .where(
        and(
          sql`date(${transactionsTable.date}) BETWEEN date(${month.startDate}) AND date(${month.endDate})`,
          eq(transactionsTable.walletId, cashWallet[0]!.id),
          // eq(transactionsTable.transactionPersonId, myTransactionPerson[0]!.id)
        )
      );
    const cashRemaining = Math.abs(Number(cashTransaction[0]?.cashAmount || 0));

    const bankTransaction = await db
      .select({
        bankAmount: sum(transactionsTable.amount)
      })
      .from(transactionsTable)
      .where(
        and(
          sql`date(${transactionsTable.date}) BETWEEN date(${month.startDate}) AND date(${month.endDate})`,
          eq(transactionsTable.walletId, bankWallet[0]!.id),
          // eq(transactionsTable.transactionPersonId, myTransactionPerson[0]!.id)
        )
      );
    const bankRemaining = Math.abs(Number(bankTransaction[0]?.bankAmount || 0));

    // Query mustPayTransactions table with month_id = monthId
    const mustPayResult = await db
      .select({
        mustPayTotalAmount: sum(mustPayTransactionsTable.amount)
      })
      .from(mustPayTransactionsTable)
      .where(eq(mustPayTransactionsTable.monthId, monthId));

    const mustPayTotalAmount = Number(mustPayResult[0]?.mustPayTotalAmount || 0);
    console.log("mustPayTotalAmount", mustPayTotalAmount);

    // Set remainingAmount = abs(totalAmount + mustPayTotalAmount)
    const remainingAmount = Math.abs(totalAmount + mustPayTotalAmount);

    // Calculate perDayAmount = remainingAmount - (200 * (dayLeft-1)), then floor to remove decimals
    const perDayAmount = Math.floor(remainingAmount - (200 * (dayLeft-1)));

    const response: GenericResponseInterface = {
      success: true,
      message: "Summary calculation retrieved successfully",
      data: {
        totalAmount: Math.abs(totalAmount),
        dayLeft,
        perDayAmount,
        bankRemaining,
        cashRemaining,
      }
    };

    return c.json(response, 200);

  } catch (error) {
    console.error('Error getting perDay calculation:', error);
    const response: GenericResponseInterface = {
      success: false,
      message: "Internal server error",
      data: null
    };
    return c.json(response, 500);
  }
});

