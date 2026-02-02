import * as schema from "./schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
	throw new Error("Missing required environment variable.");
}

const client = neon(databaseUrl);

/**
 * The PostgreSQL database.
 * @public
 */
export default drizzle({ client, schema });
