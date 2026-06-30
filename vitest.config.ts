import { defineConfig } from "vitest/config";

/**
 * Vitest configuration. `resolve.tsconfigPaths` teaches Vitest the `baseUrl`
 * path aliases (e.g. `core/...`, `types/...`) so domain and use-case tests can
 * import source modules exactly as the app does.
 * @internal
 */
export default defineConfig({
	resolve: { tsconfigPaths: true },
	test: {
		include: ["src/**/*.test.ts"]
	}
});
