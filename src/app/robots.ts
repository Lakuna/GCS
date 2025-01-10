import type { MetadataRoute } from "next";
import domain from "util/domain";

/**
 * The website's robots file.
 * @returns The robots file.
 * @public
 */
export default function robots() {
	return {
		rules: {
			allow: "/",
			userAgent: "*"
		},
		sitemap: new URL("/sitemap.xml", domain).href
	} satisfies MetadataRoute.Robots;
}
