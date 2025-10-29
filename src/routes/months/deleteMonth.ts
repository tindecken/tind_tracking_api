import { Hono } from "hono";
import { tbValidator } from '@hono/typebox-validator';
import Type from 'typebox';
import { getMonthId } from '../../utils/getMonthId';
import type { GenericResponseInterface } from "../../models/GenericResponseInterface";
import { db } from "../../db/index";
import { monthsTable, mustPayTransactionsTable } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

const idParamSchema = Type.Object({
  id: Type.String(),
});

export const deleteMonthRoute = new Hono();

deleteMonthRoute.delete("/:id", tbValidator('param', idParamSchema), async (c) => {
  try {
    const { id } = c.req.valid('param');
    const monthId = parseInt(id);

    if (isNaN(monthId) || monthId <= 0 || !Number.isInteger(monthId)) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Invalid month ID - must be a positive integer",
        data: null
      };
      return c.json(response, 400);
    }

    // Check if the month exists
    const existing = await db
      .select()
      .from(monthsTable)
      .where(eq(monthsTable.id, monthId))
      .limit(1);

    if (existing.length === 0) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Month not found",
        data: null
      };
      return c.json(response, 404);
    }

    // Check if there are any mustPayTransactions linked to this month
    const linkedMustPayTransactions = await db
      .select()
      .from(mustPayTransactionsTable)
      .where(eq(mustPayTransactionsTable.monthId, monthId))
      .limit(1);

    if (linkedMustPayTransactions.length > 0) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Cannot delete month - it has associated must-pay transactions",
        data: null
      };
      return c.json(response, 409); // Conflict status code
    }

    // Delete the month
    await db
      .delete(monthsTable)
      .where(eq(monthsTable.id, monthId));

    const response: GenericResponseInterface = {
      success: true,
      message: "Month deleted successfully",
      data: { id: monthId }
    };
    return c.json(response);

  } catch (error) {
    console.error('Error deleting month:', error);
    const response: GenericResponseInterface = {
      success: false,
      message: "Internal server error",
      data: null
    };
    return c.json(response, 500);
  }
});
