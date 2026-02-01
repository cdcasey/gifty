import { createId } from "@paralleldrive/cuid2";
import { createServerFn } from "@tanstack/react-start";
import {
	getCookie,
	getRequestUrl,
	setCookie,
} from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { magicLinks, sessions, users } from "@/db/schema";
import { sendMagicLinkEmail } from "@/lib/email";

const MOCK_USER_COOKIE = "mock_user_id";

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async () => {
		const userId = getCookie(MOCK_USER_COOKIE);
		if (!userId) return null;

		const db = getDb(env);

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		// Keeping for reference. Equivalent.
		// const user = await db.query.users.findFirst({
		// 	where: eq(users.id, userId),
		// });

		return user ?? null;
	},
);

// TODO: add Zod validation schema for the inputValidator function
export const setMockUser = createServerFn({ method: "POST" })
	.inputValidator((data: { userId: string }) => data)
	.handler(async ({ data }) => {
		setCookie(MOCK_USER_COOKIE, data.userId, { httpOnly: true, path: "/" });
	});

export const requestMagicLink = createServerFn({ method: "POST" })
	.inputValidator((data: { email: string }) => {
		const email = data.email.toLowerCase().trim();
		if (!email || !email.includes("@")) {
			throw new Error("Invalid email address");
		}
		return { email };
	})
	.handler(async ({ data }) => {
		const db = getDb(env);
		const token = createId();
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

		await db.insert(magicLinks).values({
			email: data.email,
			token,
			expires_at: expiresAt,
		});

		const url = getRequestUrl();
		const baseUrl = `${url.protocol}//${url.host}`;

		await sendMagicLinkEmail(
			env as typeof env & { RESEND_API_KEY: string },
			data.email,
			token,
			baseUrl,
		);

		return { success: true };
	});

export const verifyMagicLink = createServerFn({ method: "POST" })
	.inputValidator((data: { token: string }) => data)
	.handler(async ({ data }) => {
		const db = getDb(env);

		// Find the magic link
		const [link] = await db
			.select()
			.from(magicLinks)
			.where(eq(magicLinks.token, data.token))
			.limit(1);

		if (!link) {
			throw new Error("Invalid or expired link");
		}

		if (link.used_at) {
			throw new Error("This link has already been used");
		}

		if (link.expires_at < new Date()) {
			throw new Error("This link has expired");
		}

		// Mark as used
		await db
			.update(magicLinks)
			.set({ used_at: new Date() })
			.where(eq(magicLinks.id, link.id));

		// Get or create user
		let [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, link.email))
			.limit(1);

		if (!user) {
			const [newUser] = await db
				.insert(users)
				.values({
					email: link.email,
					name: link.email.split("@")[0],
				})
				.returning();
			user = newUser;
		}

		// Create session
		const sessionToken = createId();
		const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

		await db.insert(sessions).values({
			user_id: user.id,
			token: sessionToken,
			expires_at: sessionExpires,
		});

		setCookie("session", sessionToken, {
			httpOnly: true,
			path: "/",
			expires: sessionExpires,
		});

		return { success: true, user };
	});
