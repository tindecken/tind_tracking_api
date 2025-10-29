import { Hono } from "hono";
import { tbValidator } from "@hono/typebox-validator";
import Type from "typebox";
import type { GenericResponseInterface } from "../../models/GenericResponseInterface";
import { db } from "../../db/index";
import { mustPayTransactionsTable } from "../../../drizzle/schema";

const addMustPayTransactionsSchema = Type.Object({
  transactionPersonId: Type.Number(),
  monthId: Type.Number(),
  description: Type.String(),
  amount: Type.Number(),
});

export const addMustPayTransactionsRoute = new Hono();

addMustPayTransactionsRoute.post("/",  tbValidator("json", addMustPayTransactionsSchema),  async (c) => {
    try {
      const body = c.req.valid("json");

      // Insert the mustPayTransaction
      const result = await db
        .insert(mustPayTransactionsTable)
        .values({
          transactionPersonId: body.transactionPersonId,
          monthId: body.monthId,
          description: body.description,
          amount: body.amount,
        })
        .returning();

      const response: GenericResponseInterface = {
        success: true,
        message: "MustPayTransaction added successfully",
        data: result[0],
      };
      return c.json(response, 201);
    } catch (error) {
      console.error("Error adding mustPayTransaction:", error);
      const response: GenericResponseInterface = {
        success: false,
        message: "Internal server error",
        data: null,
      };
      return c.json(response, 500);
    }
  }
);
