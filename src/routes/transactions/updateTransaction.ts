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

const updateTransactionSchema = Type.Object({
  transactionPersonId: Type.Optional(Type.Number()),
  walletId: Type.Optional(Type.Number()),
  mustPayTransactionId: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
  date: Type.Optional(Type.String({ format: "date" })),
  description: Type.Optional(Type.String()),
  amount: Type.Optional(Type.Number()),
});

const idParamSchema = Type.Object({
  id: Type.String(),
});

export const updateTransactionRoute = new Hono();

updateTransactionRoute.put(
  "/:id",
  tbValidator("json", updateTransactionSchema),
  tbValidator("param", idParamSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const transactionId = parseInt(id);

      if (isNaN(transactionId)) {
        const response: GenericResponseInterface = {
          success: false,
          message: "Invalid transaction ID",
          data: null,
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
          data: null,
        };
        return c.json(response, 404);
      }

      const existingTransaction = existing[0];
      if (!existingTransaction) {
        const response: GenericResponseInterface = {
          success: false,
          message: "Transaction not found",
          data: null,
        };
        return c.json(response, 404);
      }

      // Build update object with only provided fields
      const updateData: any = {};
      if (body.transactionPersonId !== undefined)
        updateData.transactionPersonId = body.transactionPersonId;
      if (body.walletId !== undefined) updateData.walletId = body.walletId;
      if (body.date !== undefined) updateData.date = body.date;
      if (body.description !== undefined)
        updateData.description = body.description;

      // Handle mustPayTransactionId changes
      const oldMustPayTransactionId = existingTransaction.mustPayTransactionId;
      const newMustPayTransactionId =
        body.mustPayTransactionId !== undefined
          ? body.mustPayTransactionId
          : oldMustPayTransactionId;
      const oldAmount = existingTransaction.amount;
      const newAmount = body.amount !== undefined ? body.amount : oldAmount;

      // If mustPayTransactionId or amount changed, we need to update mustPayTransactions
      if (
        body.mustPayTransactionId !== undefined ||
        body.amount !== undefined
      ) {
        // Step 1: Restore the old mustPayTransaction amount if it existed
        if (oldMustPayTransactionId) {
          const oldMustPayTransaction = await db
            .select()
            .from(mustPayTransactionsTable)
            .where(eq(mustPayTransactionsTable.id, oldMustPayTransactionId))
            .limit(1);

          if (oldMustPayTransaction.length > 0 && oldMustPayTransaction[0]) {
            const restoredAmount = oldMustPayTransaction[0].amount + oldAmount;
            await db
              .update(mustPayTransactionsTable)
              .set({ amount: restoredAmount })
              .where(eq(mustPayTransactionsTable.id, oldMustPayTransactionId));
          }
        }

        // Step 2: Apply the new mustPayTransaction amount if it exists
        if (newMustPayTransactionId) {
          const newMustPayTransaction = await db
            .select()
            .from(mustPayTransactionsTable)
            .where(eq(mustPayTransactionsTable.id, newMustPayTransactionId))
            .limit(1);

          if (newMustPayTransaction.length === 0) {
            const response: GenericResponseInterface = {
              success: false,
              message: "mustPayTransaction not found",
              data: null,
            };
            return c.json(response, 404);
          }

          const mustPayTxn = newMustPayTransaction[0];
          if (!mustPayTxn) {
            const response: GenericResponseInterface = {
              success: false,
              message: "mustPayTransaction not found",
              data: null,
            };
            return c.json(response, 404);
          }

          // Update mustPayTransaction amount based on comparison
          if (mustPayTxn.amount <= newAmount) {
            await db
              .update(mustPayTransactionsTable)
              .set({ amount: 0 })
              .where(eq(mustPayTransactionsTable.id, newMustPayTransactionId));
          } else {
            const reducedAmount = mustPayTxn.amount - newAmount;
            await db
              .update(mustPayTransactionsTable)
              .set({ amount: reducedAmount })
              .where(eq(mustPayTransactionsTable.id, newMustPayTransactionId));
          }

          // Use mustPayTransaction description if not provided
          if (body.description === undefined) {
            updateData.description =
              mustPayTxn.description ?? existingTransaction.description;
          }
        }

        updateData.mustPayTransactionId = newMustPayTransactionId;
      }

      if (body.amount !== undefined) updateData.amount = body.amount;

      // If no fields to update
      if (Object.keys(updateData).length === 0) {
        const response: GenericResponseInterface = {
          success: false,
          message: "No fields to update",
          data: null,
        };
        return c.json(response, 400);
      }

      // Update the transaction
      const result = await db
        .update(transactionsTable)
        .set(updateData)
        .where(eq(transactionsTable.id, transactionId))
        .returning();

      const response: GenericResponseInterface = {
        success: true,
        message: "Transaction updated successfully",
        data: result[0],
      };
      return c.json(response);
    } catch (error) {
      console.error("Error updating transaction:", error);
      const response: GenericResponseInterface = {
        success: false,
        message: "Internal server error",
        data: null,
      };
      return c.json(response, 500);
    }
  }
);
