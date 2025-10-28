import { Hono } from "hono";
import { tbValidator } from '@hono/typebox-validator';
import Type from 'typebox';
import { getMonthId } from '../../utils/getMonthId';
import type { GenericResponseInterface } from "../../models/GenericResponseInterface";
import { db } from "../../db/index";
import { transactionsTable, mustPayTransactionsTable } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

const addTransactionSchema = Type.Object({
  transactionPersonId: Type.Number(),
  walletId: Type.Number(),
  mustPayTransactionId: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
  date: Type.Optional(Type.Union([Type.String({ format: "date" }), Type.Null()])),
  description: Type.Optional(Type.String()),
  amount: Type.Number()
});

export const addTransactionRoute = new Hono();

addTransactionRoute.post("/", tbValidator('json', addTransactionSchema), async (c) => {
  try {
    const body = c.req.valid('json');

    // Handle date: if null or not provided, use today's date at UTC+7
    const transactionDate: string = (body.date ?? new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0]) as string;

    // Find monthId using the utility
    const monthId = await getMonthId(transactionDate);
    if (monthId === -1) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Month not found",
        data: null
      };
      return c.json(response, 404);
    }

    let finalDescription: string | undefined = body.description;
    let finalAmount = body.amount;
    let finalMustPayTransactionId = body.mustPayTransactionId ?? null;

    // Handle mustPayTransactionId if provided
    if (body.mustPayTransactionId && typeof body.mustPayTransactionId === 'number') {
      // Find the mustPayTransaction
      const mustPayTransactions = await db
        .select()
        .from(mustPayTransactionsTable)
        .where(eq(mustPayTransactionsTable.id, body.mustPayTransactionId))
        .limit(1);

      if (mustPayTransactions.length === 0) {
        const response: GenericResponseInterface = {
          success: false,
          message: "mustPayTransaction not found",
          data: null
        };
        return c.json(response, 404);
      }

      const mustPayTransaction = mustPayTransactions[0];
      if (!mustPayTransaction) {
        const response: GenericResponseInterface = {
          success: false,
          message: "mustPayTransaction not found",
          data: null
        };
        return c.json(response, 404);
      }

      // Use mustPayTransaction description
      finalDescription = mustPayTransaction.description ?? undefined;

      // Update mustPayTransaction amount based on comparison
      if (mustPayTransaction.amount <= body.amount) {
        // Set mustPayTransaction amount to 0
        await db
          .update(mustPayTransactionsTable)
          .set({ amount: 0 })
          .where(eq(mustPayTransactionsTable.id, body.mustPayTransactionId));
      } else {
        // Reduce mustPayTransaction amount
        const newAmount = mustPayTransaction.amount - body.amount;
        await db
          .update(mustPayTransactionsTable)
          .set({ amount: newAmount })
          .where(eq(mustPayTransactionsTable.id, body.mustPayTransactionId));
      }
    }

    // Insert the transaction
    const result = await db
      .insert(transactionsTable)
      .values({
        transactionPersonId: body.transactionPersonId,
        walletId: body.walletId,
        mustPayTransactionId: finalMustPayTransactionId ?? null,
        date: transactionDate,
        description: finalDescription,
        amount: finalAmount
      })
      .returning();

    const response: GenericResponseInterface = {
      success: true,
      message: "Transaction added successfully",
      data: result[0]
    };
    return c.json(response, 201);

  } catch (error) {
    console.error('Error adding transaction:', error);
    const response: GenericResponseInterface = {
      success: false,
      message: "Internal server error",
      data: null
    };
    return c.json(response, 500);
  }
});

