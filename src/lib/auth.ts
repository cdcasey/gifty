import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { users } from "@/db/schema";

const MOCK_USER_COOKIE = "mock_user_id";

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async () => {
		const userId = getCookie(MOCK_USER_COOKIE);
		if (!userId) return null;

		const db = getDb(env);

		// Keeping for reference. Equivalent.
		// const [user] = await db
		// 	.select()
		// 	.from(users)
		// 	.where(eq(users.id, userId))
		// 	.limit(1);

		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});

		return user ?? null;
	},
);

// TODO: add Zod validation schema for the inputValidator function
export const setMockUser = createServerFn({ method: "POST" })
	.inputValidator((data: { userId: string }) => data)
	.handler(async ({ data }) => {
		setCookie(MOCK_USER_COOKIE, data.userId, { httpOnly: true, path: "/" });
	});
