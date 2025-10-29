import { Hono } from "hono";
import { tbValidator } from '@hono/typebox-validator';
import Type from 'typebox';
import { getMonthId } from '../../utils/getMonthId';
import type { GenericResponseInterface } from "../../models/GenericResponseInterface";
import { db } from "../../db/index";
import { monthsTable } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

const updateMonthSchema = Type.Object({
  name: Type.Optional(Type.String()),
  startDate: Type.Optional(Type.String()),
  endDate: Type.Optional(Type.String()),
});

const idParamSchema = Type.Object({
  id: Type.String(),
});

export const updateMonthRoute = new Hono();

updateMonthRoute.put(
  "/:id",
  tbValidator("json", updateMonthSchema),
  tbValidator("param", idParamSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const monthId = parseInt(id);

      if (isNaN(monthId) || monthId <= 0 || !Number.isInteger(monthId)) {
        const response: GenericResponseInterface = {
          success: false,
          message: "Invalid month ID - must be a positive integer",
          data: null,
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
          data: null,
        };
        return c.json(response, 404);
      }

      // Build update object with only provided fields
      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.startDate !== undefined) updateData.startDate = body.startDate;
      if (body.endDate !== undefined) updateData.endDate = body.endDate;

      // If no fields to update
      if (Object.keys(updateData).length === 0) {
        const response: GenericResponseInterface = {
          success: false,
          message: "No fields to update",
          data: null,
        };
        return c.json(response, 400);
      }

      // Validate dates if provided
      if (body.startDate || body.endDate) {
        const currentMonth = existing[0]!;
        const startDate = new Date(body.startDate || currentMonth.startDate);
        const endDate = new Date(body.endDate || currentMonth.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          const response: GenericResponseInterface = {
            success: false,
            message: "Invalid date format. Use YYYY-MM-DD format",
            data: null,
          };
          return c.json(response, 400);
        }

        if (startDate >= endDate) {
          const response: GenericResponseInterface = {
            success: false,
            message: "Start date must be before end date",
            data: null,
          };
          return c.json(response, 400);
        }
      }

      // Update the month
      const result = await db
        .update(monthsTable)
        .set(updateData)
        .where(eq(monthsTable.id, monthId))
        .returning();

      const response: GenericResponseInterface = {
        success: true,
        message: "Month updated successfully",
        data: result[0],
      };
      return c.json(response);
    } catch (error) {
      console.error("Error updating month:", error);
      const response: GenericResponseInterface = {
        success: false,
        message: "Internal server error",
        data: null,
      };
      return c.json(response, 500);
    }
  }
);
