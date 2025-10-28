import { Hono } from "hono";
import { tbValidator } from '@hono/typebox-validator';
import Type from 'typebox';
import { getMonthId } from '../../utils/getMonthId';
import type { GenericResponseInterface } from "../../models/GenericResponseInterface";
import { db } from "../../db/index";
import { mustPayTransactionsTable } from "../../../drizzle/schema";
import { eq, ne, and } from "drizzle-orm";

const getMustPayTransactionsSchema = Type.Object({
  date: Type.Optional(Type.Union([Type.String({ format: "date" }), Type.Null()]))
});

export const getMustPayTransactionsRoute = new Hono();

getMustPayTransactionsRoute.get("/", tbValidator('query', getMustPayTransactionsSchema), async (c) => {
  try {
    const { date } = c.req.valid('query');

    // Handle date: if null or not provided, use today's date at UTC+7
    const targetDate: string = (date ?? new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0]) as string;

    // Find monthId using the utility
    const monthId = await getMonthId(targetDate);
    if (monthId === -1) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Month not found",
        data: null
      };
      return c.json(response, 404);
    }

    // Find all mustPayTransactions for this month with amount != 0
    const mustPayTransactions = await db
      .select()
      .from(mustPayTransactionsTable)
      .where(
        and(
          eq(mustPayTransactionsTable.monthId, monthId),
          ne(mustPayTransactionsTable.amount, 0)
        )
      );

    // Calculate total amount of all records
    const totalAmount = mustPayTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    const response: GenericResponseInterface = {
      success: true,
      message: "MustPayTransactions retrieved successfully",
      data: {
        records: mustPayTransactions,
        totalAmount: totalAmount,
        totalRecords: mustPayTransactions.length
      }
    };
    return c.json(response);

  } catch (error) {
    console.error('Error getting mustPayTransactions:', error);
    const response: GenericResponseInterface = {
      success: false,
      message: "Internal server error",
      data: null
    };
    return c.json(response, 500);
  }
});

