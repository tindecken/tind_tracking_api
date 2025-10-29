import { Hono } from "hono";
import { tbValidator } from "@hono/typebox-validator";
import Type from "typebox";
import type { GenericResponseInterface } from "../../models/GenericResponseInterface";
import { db } from "../../db/index";
import {
  transactionsTable,
  mustPayTransactionsTable,
} from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

const idParamSchema = Type.Object({
  id: Type.String(),
});

export const deleteTransactionRoute = new Hono();

deleteTransactionRoute.delete("/:id", tbValidator('param', idParamSchema), async (c) => {
  try {
    const { id } = c.req.valid('param');
    const transactionId = parseInt(id);

    if (isNaN(transactionId) || transactionId <= 0 || !Number.isInteger(transactionId)) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Invalid transaction ID - must be a positive integer",
        data: null
      };
      return c.json(response, 400);
    }

    // Check if the transaction exists
    const existing = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
      .limit(1);

    if (existing.length === 0) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Transaction not found",
        data: null
      };
      return c.json(response, 404);
    }

    const existingTransaction = existing[0];
    if (!existingTransaction) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Transaction not found",
        data: null
      };
      return c.json(response, 404);
    }

    // Restore the mustPayTransaction amount if it was linked
    if (existingTransaction.mustPayTransactionId) {
      const mustPayTransaction = await db
        .select()
        .from(mustPayTransactionsTable)
        .where(eq(mustPayTransactionsTable.id, existingTransaction.mustPayTransactionId))
        .limit(1);

      if (mustPayTransaction.length > 0 && mustPayTransaction[0]) {
        const restoredAmount = mustPayTransaction[0].amount + existingTransaction.amount;
        await db
          .update(mustPayTransactionsTable)
          .set({ amount: restoredAmount })
          .where(eq(mustPayTransactionsTable.id, existingTransaction.mustPayTransactionId));
      }
    }

    // Delete the transaction
    await db
      .delete(transactionsTable)
      .where(eq(transactionsTable.id, transactionId));

    const response: GenericResponseInterface = {
      success: true,
      message: "Transaction deleted successfully",
      data: { id: transactionId }
    };
    return c.json(response);

  } catch (error) {
    console.error('Error deleting transaction:', error);
    const response: GenericResponseInterface = {
      success: false,
      message: "Internal server error",
      data: null
    };
    return c.json(response, 500);
  }
});
