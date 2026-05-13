import type { MetadataRoute } from "next";
import domain from "util/domain";

/**
 * The website's sitemap.
 * @returns The sitemap.
 * @public
 */
export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{ url: new URL("/api", domain).href },
		{ url: new URL("/draft", domain).href },
		{ url: new URL("/leaderboards", domain).href },
		{ url: new URL("/players", domain).href },
		{ url: new URL("/rulebook", domain).href },
		{ url: new URL("/schedule", domain).href },
		{ url: new URL("/seasons", domain).href },
		{ url: new URL("/signup", domain).href },
		{ url: new URL("/teams", domain).href },
		{ url: new URL("/", domain).href }
	];
}
