import { Hono } from "hono";
import { getTransactionColumn } from '../../utils/getTransactionColumn';
import getAuthenticatedSheets from '../../utils/getAuthenticatedSheets';
import getPerDay from '../../utils/getPerDay';
import Type from 'typebox'
import type { GenericResponseInterface } from '../../models/GenericResponseInterface';

export const giveNhi = new Hono();
const schema = Type.Object({
  amount: Type.Number(),
  isCash: Type.Boolean(),
})
// ID of your target spreadsheet (the long ID from the URL)
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const transactionSheet = "T"

giveNhi.post('/giveNhi', async (c) => {
  try {
    // Get authenticated sheets instance
    const sheets = await getAuthenticatedSheets();

    const body = await c.req.json();
    const { amount, isCash } = body;

    if (!amount || !isCash) {
      const response: GenericResponseInterface = {
        success: false,
        message: 'Invalid request',
        data: null,
      };
      return c.json(response, 400);
    }
  } catch (error: any) {
    const response: GenericResponseInterface = {
      success: false,
      message: error
        ? `Error while giving Nhi: ${error}${error.code ? ` - ${error.code}` : ""}`
        : "Error while giving Nhi",
      data: null,
    };
    return c.json(response, 500);
  }
})
