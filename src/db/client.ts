import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { D1Database } from "@cloudflare/workers-types/experimental";

export function getDb(env: { gifty_db: D1Database }) {
	return drizzle(env.gifty_db, { schema });
}
