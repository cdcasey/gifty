import { createId } from "@paralleldrive/cuid2";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { users, wishlists, wishlistShares } from "@/db/schema";
import { getCurrentUser } from "./auth";

export const generateShareToken = createServerFn({ method: "POST" })
	.inputValidator((wishlistId: string) => wishlistId)
	.handler(async ({ data: wishlistId }) => {
		const user = await getCurrentUser();
		if (!user) throw new Error("Not authenticated");

		const db = getDb(env);

		// Verify ownership
		const [wishlist] = await db
			.select()
			.from(wishlists)
			.where(and(eq(wishlists.id, wishlistId), eq(wishlists.owner_id, user.id)))
			.limit(1);

		if (!wishlist) throw new Error("Wishlist not found or not owned by you");

		// Generate token if not exists
		const token = wishlist.share_token || createId();

		if (!wishlist.share_token) {
			await db.update(wishlists).set({ share_token: token }).where(eq(wishlists.id, wishlistId));
		}

		return { token };
	});

export const acceptShare = createServerFn({ method: "POST" })
	.inputValidator((token: string) => token)
	.handler(async ({ data: token }) => {
		const user = await getCurrentUser();
		if (!user) throw new Error("Not authenticated");

		const db = getDb(env);

		// Find wishlist by token
		const [wishlist] = await db
			.select()
			.from(wishlists)
			.where(eq(wishlists.share_token, token))
			.limit(1);

		if (!wishlist) throw new Error("Invalid share link");

		// Can't share with yourself
		if (wishlist.owner_id === user.id) {
			throw new Error("This is your own wishlist");
		}

		// Check if already shared
		const [existing] = await db
			.select()
			.from(wishlistShares)
			.where(
				and(
					eq(wishlistShares.wishlist_id, wishlist.id),
					eq(wishlistShares.shared_with_user_id, user.id),
				),
			)
			.limit(1);

		if (!existing) {
			await db.insert(wishlistShares).values({
				wishlist_id: wishlist.id,
				shared_with_user_id: user.id,
			});
		}

		return { wishlistId: wishlist.id };
	});

export const getSharedWishlists = createServerFn({ method: "GET" }).handler(async () => {
	const user = await getCurrentUser();
	if (!user) throw new Error("Not authenticated");

	const db = getDb(env);

	const shared = await db
		.select({
			wishlist: wishlists,
			owner: users,
		})
		.from(wishlistShares)
		.innerJoin(wishlists, eq(wishlistShares.wishlist_id, wishlists.id))
		.innerJoin(users, eq(wishlists.owner_id, users.id))
		.where(eq(wishlistShares.shared_with_user_id, user.id));

	return shared;
});
