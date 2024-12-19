import "./src/scripts/env";
import { defineConfig } from "drizzle-kit";

const url = process.env["POSTGRES_URL"];
if (!url) {
	throw new Error("Missing required environment variable.");
}

/**
 * The Drizzle configuration that is used to push updates to the schema to the database.
 * @public
 */
export default defineConfig({
	dbCredentials: { url },
	dialect: "postgresql",
	out: "./drizzle",
	schema: "./src/scripts/schema.ts"
});
