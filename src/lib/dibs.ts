import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { eq, and } from "drizzle-orm";

import { getDb } from "@/db/client";
import { users, wishlists, items, dibs } from "@/db/schema";
import { getCurrentUser } from "./auth";

export const deleteItem = createServerFn({ method: "POST" })
	.inputValidator((itemId: string) => itemId)
	.handler(async ({ data: itemId }) => {
		const user = await getCurrentUser();
		if (!user) throw new Error("Not authenticated");

		const db = getDb(env);

		// Verify the item belongs to a wishlist owned by the user
		const [item] = await db
			.select({
				item: items,
				wishlist: wishlists,
			})
			.from(items)
			.innerJoin(wishlists, eq(items.wishlist_id, wishlists.id))
			.where(eq(items.id, itemId))
			.limit(1);

		if (!item) throw new Error("Item not found");
		if (item.wishlist.owner_id !== user.id) {
			throw new Error("You can only delete items from your own wishlists");
		}

		// Delete associated dibs first
		await db.delete(dibs).where(eq(dibs.item_id, itemId));

		// Delete the item
		await db.delete(items).where(eq(items.id, itemId));

		return { success: true };
	});

export const importItemToShoppingList = createServerFn({ method: "POST" })
	.inputValidator((data: { itemId: string; bookId?: string }) => data)
	.handler(async ({ data }) => {
		const user = await getCurrentUser();
		if (!user) throw new Error("Not authenticated");

		const db = getDb(env);

		// Get the original item
		const [originalItem] = await db
			.select()
			.from(items)
			.where(eq(items.id, data.itemId))
			.limit(1);

		if (!originalItem) throw new Error("Item not found");

		// Find or create a "Shopping List" wishlist for this user
		let [shoppingList] = await db
			.select()
			.from(wishlists)
			.where(
				and(
					eq(wishlists.owner_id, user.id),
					eq(wishlists.title, "Shopping List")
				)
			)
			.limit(1);

		if (!shoppingList) {
			// Create shopping list if it doesn't exist
			[shoppingList] = await db
				.insert(wishlists)
				.values({
					owner_id: user.id,
					title: "Shopping List",
				})
				.returning();
		}

		// Copy the item to the shopping list
		const [copiedItem] = await db
			.insert(items)
			.values({
				wishlist_id: shoppingList.id,
				name: originalItem.name,
				notes: originalItem.notes
					? `${originalItem.notes}\n\n(Imported from item ${originalItem.id})`
					: `(Imported from item ${originalItem.id})`,
				url: originalItem.url,
				priority: originalItem.priority,
			})
			.returning();

		return { item: copiedItem, shoppingList };
	});

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

export const getWishlistItemsWithDibs = createServerFn({ method: "GET" })
	.inputValidator((wishlistId: string) => wishlistId)
	.handler(async ({ data: wishlistId }) => {
		const currentUser = await getCurrentUser();
		if (!currentUser) throw new Error("Not authenticated");

		const db = getDb(env);

		// Get the wishlist to check ownership
		const [wishlist] = await db
			.select()
			.from(wishlists)
			.where(eq(wishlists.id, wishlistId))
			.limit(1);

		if (!wishlist) throw new Error("Wishlist not found");

		const isOwner = wishlist.owner_id === currentUser.id;

		// Fetch items with dibs info
		const rawItems = await db
			.select({
				item: items,
				dibs: dibs,
				claimedByUser: users,
			})
			.from(items)
			.leftJoin(dibs, eq(items.id, dibs.item_id))
			.leftJoin(users, eq(dibs.user_id, users.id))
			.where(eq(items.wishlist_id, wishlistId));

		// Apply spoiler protection: hide who claimed items from owner
		const itemsWithDibs = rawItems.map((row) => ({
			item: row.item,
			dibs: row.dibs,
			claimedBy: isOwner ? null : row.claimedByUser,
		}));

		return {
			wishlist,
			isOwner,
			items: itemsWithDibs,
			currentUserId: currentUser.id,
		};
	});
