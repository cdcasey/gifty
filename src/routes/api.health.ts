import { createFileRoute } from "@tanstack/react-router";

import { env } from "cloudflare:workers";
import { sql } from "drizzle-orm";

import { getDb } from "@/db/client";

export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: async () => {
				try {
					const db = getDb(env);
					await db.run(sql`SELECT 1`);

					return Response.json({
						status: "healthy",
						database: "connect",
						timestamp: new Date().toISOString(),
					});
				} catch (error) {
					return Response.json(
						{
							status: "unhealthy",
							database: "disconnected",
							error: error instanceof Error ? error.message : "unknown error",
							timestamp: new Date().toISOString(),
						},
						{ status: 503 },
					);
				}
			},
		},
	},
});
