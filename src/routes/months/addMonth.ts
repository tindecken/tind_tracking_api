import { Hono } from "hono";
import { tbValidator } from '@hono/typebox-validator';
import Type from 'typebox';
import { getMonthId } from '../../utils/getMonthId';
import type { GenericResponseInterface } from "../../models/GenericResponseInterface";
import { db } from "../../db/index";
import { monthsTable } from "../../../drizzle/schema";

const addMonthSchema = Type.Object({
  name: Type.String(),
  startDate: Type.String(),
  endDate: Type.String(),
});

export const addMonthRoute = new Hono();

addMonthRoute.post("/", tbValidator("json", addMonthSchema), async (c) => {
  try {
    const body = c.req.valid("json");

    // Validate date format (basic check)
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

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

    // Insert the month
    const result = await db
      .insert(monthsTable)
      .values({
        name: body.name,
        startDate: body.startDate,
        endDate: body.endDate,
      })
      .returning();

    const response: GenericResponseInterface = {
      success: true,
      message: "Month added successfully",
      data: result[0],
    };
    return c.json(response, 201);
  } catch (error) {
    console.error("Error adding month:", error);
    const response: GenericResponseInterface = {
      success: false,
      message: "Internal server error",
      data: null,
    };
    return c.json(response, 500);
  }
});
