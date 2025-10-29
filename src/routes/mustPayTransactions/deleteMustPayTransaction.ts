import { Hono } from "hono";
import { tbValidator } from "@hono/typebox-validator";
import Type from "typebox";
import type { GenericResponseInterface } from "../../models/GenericResponseInterface";
import { db } from "../../db/index";
import { mustPayTransactionsTable } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

const deleteMustPayTransactionSchema = Type.Object({
  id: Type.String()
});

export const deleteMustPayTransactionsRoute = new Hono();

deleteMustPayTransactionsRoute.delete("/:id", tbValidator('param', deleteMustPayTransactionSchema), async (c) => {
  try {
    const { id } = c.req.valid('param');

    const mustPayTransactionId = parseInt(id);

    if (isNaN(mustPayTransactionId) || mustPayTransactionId <= 0 || !Number.isInteger(mustPayTransactionId)) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Invalid transaction ID - must be a positive integer",
        data: null
      };
      return c.json(response, 400);
    }
    // Check if the mustPayTransaction exists
    const existingTransaction = await db
      .select()
      .from(mustPayTransactionsTable)
      .where(eq(mustPayTransactionsTable.id, mustPayTransactionId))
      .limit(1);

    if (existingTransaction.length === 0) {
      const response: GenericResponseInterface = {
        success: false,
        message: `MustPayTransaction ${mustPayTransactionId} not found`,
        data: null
      };
      return c.json(response, 404);
    }

    // Delete the mustPayTransaction
    const result = await db
      .delete(mustPayTransactionsTable)
      .where(eq(mustPayTransactionsTable.id, mustPayTransactionId))
      .returning();

    const response: GenericResponseInterface = {
      success: true,
      message: "MustPayTransaction deleted successfully",
      data: result[0]
    };
    return c.json(response, 200);

  } catch (error) {
    console.error('Error deleting mustPayTransaction:', error);
    const response: GenericResponseInterface = {
      success: false,
      message: "Internal server error",
      data: null
    };
    return c.json(response, 500);
  }
});