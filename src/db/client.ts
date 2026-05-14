import "server-only";

import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";

type Database = LibSQLDatabase<typeof schema>;

let client: Client | undefined;
let db: Database | undefined;

function getDatabaseUrl() {
  const url = process.env.TURSO_DATABASE_URL;

  if (!url) {
    return "file:./local.db";
  }

  return url;
}

function getDatabaseAuthToken() {
  return process.env.TURSO_AUTH_TOKEN;
}

export function getDbClient() {
  if (!client) {
    client = createClient({
      url: getDatabaseUrl(),
      authToken: getDatabaseAuthToken()
    });
  }

  return client;
}

export function getDb() {
  if (!db) {
    db = drizzle(getDbClient(), { schema });
  }

  return db;
}

export type { Database };
