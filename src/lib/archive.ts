import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { eq, and, lt } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wishlists } from "@/db/schema";
import { getCurrentUser } from "./auth";

export const archiveWishlist = createServerFn({ method: "POST" })
	.inputValidator((wishlistId: string) => wishlistId)
	.handler(async ({ data: wishlistId }) => {
		const user = await getCurrentUser();
		if (!user) throw new Error("Not authenticated");

		const db = getDb(env);

		// Verify ownership
		const [wishlist] = await db
			.select()
			.from(wishlists)
			.where(eq(wishlists.id, wishlistId))
			.limit(1);

		if (!wishlist) throw new Error("Wishlist not found");
		if (wishlist.owner_id !== user.id) {
			throw new Error("Only the owner can archive this wishlist");
		}

		// Archive the wishlist
		const [archived] = await db
			.update(wishlists)
			.set({ is_archived: true })
			.where(eq(wishlists.id, wishlistId))
			.returning();

		return archived;
	});

export const unarchiveWishlist = createServerFn({ method: "POST" })
	.inputValidator((wishlistId: string) => wishlistId)
	.handler(async ({ data: wishlistId }) => {
		const user = await getCurrentUser();
		if (!user) throw new Error("Not authenticated");

		const db = getDb(env);

		// Verify ownership
		const [wishlist] = await db
			.select()
			.from(wishlists)
			.where(eq(wishlists.id, wishlistId))
			.limit(1);

		if (!wishlist) throw new Error("Wishlist not found");
		if (wishlist.owner_id !== user.id) {
			throw new Error("Only the owner can unarchive this wishlist");
		}

		// Unarchive the wishlist
		const [unarchived] = await db
			.update(wishlists)
			.set({ is_archived: false })
			.where(eq(wishlists.id, wishlistId))
			.returning();

		return unarchived;
	});

export const autoArchiveExpiredWishlists = createServerFn({ method: "POST" })
	.handler(async () => {
		const user = await getCurrentUser();
		if (!user) throw new Error("Not authenticated");

		const db = getDb(env);
		const now = new Date();

		// Find all expired wishlists owned by user
		const expiredWishlists = await db
			.update(wishlists)
			.set({ is_archived: true })
			.where(
				and(
					eq(wishlists.owner_id, user.id),
					eq(wishlists.is_archived, false),
					lt(wishlists.deadline, now)
				)
			)
			.returning();

		return {
			count: expiredWishlists.length,
			archived: expiredWishlists,
		};
	});

export const getArchivedWishlists = createServerFn({ method: "GET" })
	.handler(async () => {
		const user = await getCurrentUser();
		if (!user) return [];

		const db = getDb(env);

		const archived = await db
			.select()
			.from(wishlists)
			.where(
				and(
					eq(wishlists.owner_id, user.id),
					eq(wishlists.is_archived, true)
				)
			);

		return archived;
	});
