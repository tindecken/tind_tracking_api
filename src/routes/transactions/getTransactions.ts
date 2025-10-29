import { Hono } from "hono";
import { tbValidator } from '@hono/typebox-validator';
import Type from 'typebox';
import { getMonthId } from '../../utils/getMonthId';
import type { GenericResponseInterface } from "../../models/GenericResponseInterface";
import { db } from "../../db/index";
import { transactionsTable, monthsTable } from "../../../drizzle/schema";
import { eq, sql, desc } from "drizzle-orm";

const getTransactionsSchema = Type.Object({
  date: Type.Optional(Type.Union([Type.String({ format: "date" }), Type.Null()]))
});

export const getTransactionsRoute = new Hono();

getTransactionsRoute.get("/", tbValidator('query', getTransactionsSchema), async (c) => {
  try {
    const { date } = c.req.valid('query');

    // Handle date: if null or not provided, use today's date at UTC+7
    const targetDate: string = (date ?? new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0]) as string;

    // Find monthId using the utility
    const monthId = await getMonthId(targetDate);
    if (monthId === -1) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Month not found for the given date",
        data: null
      };
      return c.json(response, 404);
    }

    // Get month record to access start_date and end_date
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

    // Get all transactions where date is between start_date and end_date, sorted by createdAt desc
    const transactions = await db
      .select()
      .from(transactionsTable)
      .where(
        sql`date(${transactionsTable.date}) BETWEEN date(${month.startDate}) AND date(${month.endDate})`
      )
      .orderBy(desc(transactionsTable.createdAt));

    const response: GenericResponseInterface = {
      success: true,
      message: "Transactions retrieved successfully",
      data: {
        records: transactions,
        totalRecords: transactions.length,
        monthId: monthId,
        monthName: month.name
      }
    };
    return c.json(response);

  } catch (error) {
    console.error('Error getting transactions:', error);
    const response: GenericResponseInterface = {
      success: false,
      message: "Internal server error",
      data: null
    };
    return c.json(response, 500);
  }
});
