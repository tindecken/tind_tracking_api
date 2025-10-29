import { Hono } from "hono";
import { tbValidator } from "@hono/typebox-validator";
import Type from "typebox";
import type { GenericResponseInterface } from "../../models/GenericResponseInterface";
import { db } from "../../db/index";
import { mustPayTransactionsTable } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

const updateMustPayTransactionsSchema = Type.Object({
  transactionPersonId: Type.Optional(Type.Number()),
  monthId: Type.Optional(Type.Number()),
  description: Type.Optional(Type.String()),
  amount: Type.Optional(Type.Number()),
});

const idParamSchema = Type.Object({
  id: Type.String(),
});

export const updateMustPayTransactionsRoute = new Hono();

updateMustPayTransactionsRoute.put(
  "/:id",
  tbValidator("json", updateMustPayTransactionsSchema),
  tbValidator("param", idParamSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const mustPayTransactionId = parseInt(id);

      if (isNaN(mustPayTransactionId)) {
        const response: GenericResponseInterface = {
          success: false,
          message: "Invalid mustPayTransaction ID",
          data: null,
        };
        return c.json(response, 400);
      }

      // Check if the mustPayTransaction exists
      const existing = await db
        .select()
        .from(mustPayTransactionsTable)
        .where(eq(mustPayTransactionsTable.id, mustPayTransactionId))
        .limit(1);

      if (existing.length === 0) {
        const response: GenericResponseInterface = {
          success: false,
          message: "MustPayTransaction not found",
          data: null,
        };
        return c.json(response, 404);
      }

      // Build update object with only provided fields
      const updateData: any = {};
      if (body.transactionPersonId !== undefined)
        updateData.transactionPersonId = body.transactionPersonId;
      if (body.monthId !== undefined) updateData.monthId = body.monthId;
      if (body.description !== undefined)
        updateData.description = body.description;
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

      // Update the mustPayTransaction
      const result = await db
        .update(mustPayTransactionsTable)
        .set(updateData)
        .where(eq(mustPayTransactionsTable.id, mustPayTransactionId))
        .returning();

      const response: GenericResponseInterface = {
        success: true,
        message: "MustPayTransaction updated successfully",
        data: result[0],
      };
      return c.json(response);
    } catch (error) {
      console.error("Error updating mustPayTransaction:", error);
      const response: GenericResponseInterface = {
        success: false,
        message: "Internal server error",
        data: null,
      };
      return c.json(response, 500);
    }
  }
);
