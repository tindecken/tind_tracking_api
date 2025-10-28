import { db } from "./index";
import {
  transactionPersonTable,
  walletsTable,
  monthsTable,
  mustPayTransactionsTable,
  transactionsTable,
} from "../../drizzle/schema";
import { sql } from "bun";

// Seed function to populate the database with sample data
export async function seed() {
  try {
    await db.delete(monthsTable);
    await db.delete(mustPayTransactionsTable);
    await db.delete(walletsTable);
    await db.delete(transactionPersonTable);
    await db.delete(transactionsTable);

    // Insert sample data into the transaction_person table
    await db.insert(transactionPersonTable).values([
      { id: 1, name: "Me" },
      { id: 2, name: "Nhi" },
    ]);
    // Insert sample data into the wallets table
    await db.insert(walletsTable).values([
      { id: 1, name: "Bank" },
      { id: 2, name: "Cash" },
    ]);
    // Insert sample data into the months table
    await db.insert(monthsTable).values([
      {
        id: 1,
        name: "October",
        startDate: "2025-10-28",
        endDate: "2025-11-27",
      },
    ]);
    // Insert sample data into mustPayTransactions
    await db.insert(mustPayTransactionsTable).values([
      {
        id: 1,
        transactionPersonId: 2,
        monthId: 1,
        description: 'Nhi',
        amount: 48000,
      },
      {
        id: 2,
        transactionPersonId: 2,
        monthId: 1,
        description: 't9',
        amount: -6500,
      },
      {
        id: 3,
        transactionPersonId: 1,
        monthId: 1,
        description: 'x',
        amount: 670,
      },
      {
        id: 4,
        transactionPersonId: 1,
        monthId: 1,
        description: 'x2',
        amount: 800,
      },
      {
        id: 5,
        transactionPersonId: 1,
        monthId: 1,
        description: 'toc',
        amount: 150,
      },
      {
        id: 6,
        transactionPersonId: 1,
        monthId: 1,
        description: 'nhot',
        amount: 150,
      },
      {
        id: 7,
        transactionPersonId: 1,
        monthId: 1,
        description: 'dt+4g',
        amount: 100,
      },
      {
        id: 8,
        transactionPersonId: 1,
        monthId: 1,
        description: 'xe',
        amount: 50,
      },
      {
        id: 9,
        transactionPersonId: 1,
        monthId: 1,
        description: 'hsbc',
        amount: -800,
      },
      {
        id: 10,
        transactionPersonId: 1,
        monthId: 1,
        description: 'n1',
        amount: 500,
      },
      {
        id: 11,
        transactionPersonId: 1,
        monthId: 1,
        description: 'n2',
        amount: 500,
      },
      {
        id: 12,
        transactionPersonId: 1,
        monthId: 1,
        description: 'y',
        amount: 1000,
      }
    ]);
    // Insert sample data into transactions table
    await db.insert(transactionsTable).values([
      {
        id: 1,
        transactionPersonId: 1,
        walletId: 1,
        date: '2025-10-28',
        mustPayTransactionId: null,
        description: 'lương',
        amount: -52351,
      },
      {
        id: 2,
        transactionPersonId: 1,
        walletId: 2,
        date: '2025-10-28',
        mustPayTransactionId: null,
        description: 'ví',
        amount: -616,
      },
      {
        id: 3,
        transactionPersonId: 2,
        walletId: 1,
        date: '2025-10-29',
        mustPayTransactionId: null,
        description: 'chuyen',
        amount: 20000,
      },
      {
        id: 4,
        transactionPersonId: 1,
        walletId: 1,
        date: '2025-10-28',
        mustPayTransactionId: null,
        description: 'cơm trưa',
        amount: 48,
      },
      {
        id: 5,
        transactionPersonId: 1,
        walletId: 1,
        date: '2025-10-28',
        mustPayTransactionId: null,
        description: 'hạt bí',
        amount: 86,
      }
    ]);
    return { success: true, message: "Database seeded successfully." };
  } catch (error) {
    console.error("Error seeding database:", error);
    return { success: false, message: `Error seeding database: ${error}` };
  }
}

// Export a function to run the seed
export async function runSeed() {
  const result = await seed();
  return result;
}

// Run the seed function if this script is executed directly
if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Failed to seed database:", error);
      process.exit(1);
    });
}