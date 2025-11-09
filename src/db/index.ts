import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../../drizzle/schema";

console.log('process.env.TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL);
console.log('process.env.TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN);
console.log('process.env.PORT:', process.env.PORT);


const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
