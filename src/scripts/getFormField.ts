/**
 * A convenience function for getting the data from a form field. Empty strings are replaced with `undefined`.
 * @param formData - The form data.
 * @param name - The name of the field to get the data from.
 * @param required - Whether or not the field is required to have content.
 * @returns The data in the field.
 * @public
 */
export default function getFormField(
	formData: FormData,
	name: string,
	required?: false
): string | undefined;

/**
 * A convenience function for getting the data from a form field. Empty strings are replaced with `undefined` unless they are required (in which case an error is thrown; this is expected to be caught in other ways).
 * @param formData - The form data.
 * @param name - The name of the field to get the data from.
 * @param required - Whether or not the field is required to have content.
 * @returns The data in the field.
 * @public
 */
export default function getFormField(
	formData: FormData,
	name: string,
	required: true
): string;

/**
 * A convenience function for getting the data from a form field. Empty strings cause an error to be thrown; this is expected to be caught in other ways.
 * @param formData - The form data.
 * @param name - The name of the field to get the data from.
 * @param required - Whether or not the field is required to have content.
 * @returns The data in the field.
 * @public
 */
export default function getFormField(
	formData: FormData,
	name: string,
	required = false
) {
	const data = formData.get(name);
	if (required && (!data || data === "")) {
		throw new Error(`The value of ${name} was invalid.`);
	}

	return typeof data === "string" && data !== "" ? data : void 0;
}
