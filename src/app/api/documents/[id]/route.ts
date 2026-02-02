import { NextRequest, NextResponse } from "next/server";
import type PageProps from "types/PageProps";
import db from "db/db";
import { documentTable } from "db/schema";
import { eq } from "drizzle-orm";

/**
 * Get document parameters.
 * @public
 */
export interface GetDocumentParams {
	/** The ID of the document. */
	id: string; // `${number}`;
}

/**
 * Get a Gauntlet Championship Series document.
 * @param _ - The request.
 * @param props - The page properties.
 * @returns A Gauntlet Champonship Series document.
 * @public
 */
export const GET = async (
	_: NextRequest,
	props: PageProps<GetDocumentParams>
): Promise<NextResponse> => {
	const id = parseInt((await props.params).id, 10);
	const [document] = await db
		.select()
		.from(documentTable)
		.where(eq(documentTable.id, id))
		.limit(1);
	if (!document) {
		return NextResponse.json(null);
	}

	const { text } = document;

	return NextResponse.json({ id, text });
};
