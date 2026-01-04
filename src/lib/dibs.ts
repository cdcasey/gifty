import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db/client";
import { dibs } from "@/db/schema";
import { getCurrentUser } from "./auth";

export const toggleDibs = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { item_id: string; status: "dibs" | "purchased" | null }) => data,
	)
	.handler(async ({ data }) => {
		const user = await getCurrentUser();
		if (!user) throw new Error("Not authenticated");

		const db = getDb(env);

		// Check if user already has a dibs record for this item
		const [existing] = await db
			.select()
			.from(dibs)
			.where(and(eq(dibs.item_id, data.item_id), eq(dibs.user_id, user.id)))
			.limit(1);

		if (data.status === null) {
			// Remove dibs
			if (existing) {
				await db.delete(dibs).where(eq(dibs.id, existing.id));
			}
			return { status: null };
		}

		if (existing) {
			// Update existing dibs
			const [updated] = await db
				.update(dibs)
				.set({ status: data.status })
				.where(eq(dibs.id, existing.id))
				.returning();
			return updated;
		} else {
			// Create new dibs
			const [created] = await db
				.insert(dibs)
				.values({
					item_id: data.item_id,
					user_id: user.id,
					status: data.status,
				})
				.returning();
			return created;
		}
	});
