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
      { id: 1, name: "Cash" },
      { id: 2, name: "Bank" },
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
        
      }
    ])
    
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