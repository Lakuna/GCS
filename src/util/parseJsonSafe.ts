/**
 * Parse a JSON string while preserving large integers (≥ 16 digits) as strings.
 *
 * JavaScript's JSON.parse coerces all numbers to IEEE 754 doubles, silently
 * losing precision for integers outside the safe range (\> 2^53 − 1). Riot game
 * IDs are ~19 digits and hit this limit. This function quotes any bare integer
 * with 16 or more digits before parsing, so they arrive as strings instead.
 *
 * The replacement only applies to unquoted JSON values (after `:` or `,` or `[`),
 * so integers already inside strings are unaffected.
 */
export default function parseJsonSafe(text: string): unknown {
	return JSON.parse(
		text.replace(
			/(?<prefix>[:,\x5B])\s*(?<value>-?\d{16,})/gu,
			'$<prefix>"$<value>"'
		)
	);
}
