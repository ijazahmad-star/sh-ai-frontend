import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Fix for Next.js edge functions
declare global {
  var __drizzle: any | undefined;
}

let db: ReturnType<typeof drizzle>;

if (process.env.NODE_ENV === "production") {
  const client = postgres(process.env.DATABASE_URL!, {
    prepare: false,
  });
  db = drizzle(client, { schema });
} else {
  if (!global.__drizzle) {
    const client = postgres(process.env.DATABASE_URL!, {
      prepare: false,
    });
    global.__drizzle = drizzle(client, { schema });
  }
  db = global.__drizzle;
}

export { db };
