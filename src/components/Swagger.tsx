"use client";

import "swagger-ui-dist/swagger-ui.css";
import { type JSX, useEffect, useRef } from "react";
import { type Spec, SwaggerUIBundle } from "swagger-ui-dist";

// This custom component exists because `swagger-ui-react` isn't as well-maintained as `swagger-ui-dist`. See swagger-api/swagger-ui#10243. Credit mostly to huraim on GitHub.

/**
 * Properties that can be passed to a Swagger UI container.
 * @public
 */
export interface SwaggerProps extends Omit<
	JSX.IntrinsicElements["div"],
	"children"
> {
	/** The OpenAPI spec */
	spec: Spec;
}

/**
 * A Swagger UI container.
 * @param props - The container's properties.
 * @returns The Swagger UI container.
 * @public
 */
export default function Swagger({ spec, ...props }: SwaggerProps): JSX.Element {
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!ref.current) {
			return;
		}

		// eslint-disable-next-line new-cap
		SwaggerUIBundle({ domNode: ref.current, spec });
	}, [spec]);

	return <div className="swagger-ui-wrapper" ref={ref} {...props} />;
}
