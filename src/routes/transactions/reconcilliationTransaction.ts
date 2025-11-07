import { Hono } from "hono";
import { tbValidator } from '@hono/typebox-validator';
import Type from 'typebox';
import { getMonthId } from '../../utils/getMonthId';
import type { GenericResponseInterface } from "../../models/GenericResponseInterface";
import { db } from "../../db/index";
import { transactionsTable, mustPayTransactionsTable, monthsTable, walletsTable, transactionPersonTable } from "../../../drizzle/schema";
import { eq, sum, sql, and } from "drizzle-orm";

const reconcilliationTransactionSchema = Type.Object({
  remainingCashAmount: Type.Number(),
  remainingBankAmount: Type.Number(),
});

export const reconcilliationTransactionRoute = new Hono();

reconcilliationTransactionRoute.post("/reconcilliation", tbValidator('json', reconcilliationTransactionSchema), async (c) => {
  try {
    const { remainingCashAmount, remainingBankAmount } = c.req.valid('json');
    
    // Set date = today in UTC+7 timezone
    const today: string = new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0]!; // YYYY-MM-DD format in UTC+7

    // Get month record and monthId from table monthsTable
    const monthId = await getMonthId(today);
    if (monthId === -1) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Month not found!",
        data: null
      };
      return c.json(response, 404);
    }

    // Get month record to access start_date and end_date
    const monthRecord = await db
      .select()
      .from(monthsTable)
      .where(eq(monthsTable.id, monthId))
      .limit(1);

    if (!monthRecord[0]) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Month record not found!!",
        data: null
      };
      return c.json(response, 404);
    }

    const month = monthRecord[0];

    // Get transactionPersonTable for 'Me'
    const myTransactionPerson = await db
      .select()
      .from(transactionPersonTable)
      .where(eq(transactionPersonTable.name, 'Me'))
      .limit(1);

    if (myTransactionPerson.length === 0) {
      const response: GenericResponseInterface = {
        success: false,
        message: "transactionPerson not found",
        data: null
      };
      return c.json(response, 404);
    }

    // Get wallet IDs for Cash and Bank
    const cashWallet = await db
      .select()
      .from(walletsTable)
      .where(eq(walletsTable.name, 'Cash'))
      .limit(1);
    
    const bankWallet = await db
      .select()
      .from(walletsTable)
      .where(eq(walletsTable.name, 'Bank'))
      .limit(1);

    if (cashWallet.length === 0 || bankWallet.length === 0) {
      const response: GenericResponseInterface = {
        success: false,
        message: "Cash or Bank wallet not found",
        data: null
      };
      return c.json(response, 404);
    }

    // Calculate current cash and bank amounts from transactions (before reconciliation)
    const cashTransaction = await db
      .select({
        cashAmount: sum(transactionsTable.amount)
      })
      .from(transactionsTable)
      .where(
        and(
          sql`date(${transactionsTable.date}) BETWEEN date(${month.startDate}) AND date(${month.endDate})`,
          eq(transactionsTable.walletId, cashWallet[0]!.id)
        )
      );
    const currentCashSum = Number(cashTransaction[0]?.cashAmount || 0);

    const bankTransaction = await db
      .select({
        bankAmount: sum(transactionsTable.amount)
      })
      .from(transactionsTable)
      .where(
        and(
          sql`date(${transactionsTable.date}) BETWEEN date(${month.startDate}) AND date(${month.endDate})`,
          eq(transactionsTable.walletId, bankWallet[0]!.id)
        )
      );
    const currentBankSum = Number(bankTransaction[0]?.bankAmount || 0);

    // Calculate reconciliation amounts
    // Since getSummary returns Math.abs() of the sum, and amounts are typically negative (expenses)
    // We need: Math.abs(currentSum + reconciliationAmount) = remainingAmount
    // If currentSum is negative: -currentSum + reconciliationAmount = remainingAmount
    // Therefore: reconciliationAmount = remainingAmount + currentSum
    const cashReconciliationAmount = -remainingCashAmount - currentCashSum;
    const bankReconciliationAmount = -remainingBankAmount - currentBankSum;

    // Insert cash reconciliation transaction if needed
    if (cashReconciliationAmount !== 0) {
      await db.insert(transactionsTable).values({
        transactionPersonId: myTransactionPerson[0]!.id,
        walletId: cashWallet[0]!.id,
        date: today,
        description: 'cash reconcilliation',
        amount: cashReconciliationAmount,
        mustPayTransactionId: null
      });
    }

    // Insert bank reconciliation transaction if needed
    if (bankReconciliationAmount !== 0) {
      await db.insert(transactionsTable).values({
        transactionPersonId: myTransactionPerson[0]!.id,
        walletId: bankWallet[0]!.id,
        date: today,
        description: 'bank reconcilliation',
        amount: bankReconciliationAmount,
        mustPayTransactionId: null
      });
    }

    const response: GenericResponseInterface = {
      success: true,
      message: "Reconciliation completed successfully",
      data: {
        cashReconciliationAmount,
        bankReconciliationAmount
      }
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

