import isDev from "./isDev";

/**
 * The raw domain name to use when not in development mode.
 * @public
 */
export const raw = "www.gcsleague.com";

/**
 * Equivalent to `window.location.origin`, but it can be used on both the server and the client.
 * @public
 */
export default isDev ?
	`http://localhost:${process.env["PORT"] ?? "3000"}/`
:	`https://${raw}/`;
