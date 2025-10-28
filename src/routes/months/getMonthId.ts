import { Hono } from "hono";
import { tbValidator } from '@hono/typebox-validator';
import Type from 'typebox';
import { getMonthId } from '../../utils/getMonthId';
import type { GenericResponseInterface } from "../../models/GenericResponseInterface";

const getMonthIdSchema = Type.Object({
  date: Type.String({ format: "date" })
});

export const getMonthIdRoute = new Hono();

getMonthIdRoute.get("/monthId", tbValidator('query', getMonthIdSchema), async (c) => {
  const { date } = c.req.valid('query');
  const monthId = await getMonthId(date);
  
  if (monthId === -1) {
    const response: GenericResponseInterface = {
      success: false,
      message: "Month not found",
      data: null
    };
    return c.json(response, 404);
  }

  const response: GenericResponseInterface = {
    success: true,
    message: "Month found",
    data: monthId
  };
  return c.json(response);
});
