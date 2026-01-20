import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { bookEntries, books, wishlistShares, wishlists } from "@/db/schema";
import { getCurrentUser } from "./auth";

export const addWishlistToBook = createServerFn({ method: "POST" })
	.inputValidator((data: { bookId: string; wishlistId: string }) => data)
	.handler(async ({ data }) => {
		const user = await getCurrentUser();
		if (!user) throw new Error("Not authenticated");

		const db = getDb(env);

		// Verify user owns the book
		const [book] = await db
			.select()
			.from(books)
			.where(and(eq(books.id, data.bookId), eq(books.owner_id, user.id)))
			.limit(1);

		if (!book) throw new Error("Book not found or not owned by you");

		// Verify wishlist exists and is shared with user
		const [share] = await db
			.select()
			.from(wishlistShares)
			.innerJoin(wishlists, eq(wishlistShares.wishlist_id, wishlists.id))
			.where(
				and(
					eq(wishlistShares.wishlist_id, data.wishlistId),
					eq(wishlistShares.shared_with_user_id, user.id)
				)
			)
			.limit(1);

		if (!share) throw new Error("Wishlist not shared with you");

		// Check for existing entry
		const [existing] = await db
			.select()
			.from(bookEntries)
			.where(
				and(
					eq(bookEntries.book_id, data.bookId),
					eq(bookEntries.wishlist_id, data.wishlistId)
				)
			)
			.limit(1);

		if (existing) {
			return existing; // Already added, return existing entry
		}

		// Create the book entry
		const [entry] = await db
			.insert(bookEntries)
			.values({
				book_id: data.bookId,
				wishlist_id: data.wishlistId,
			})
			.returning();

		return entry;
	});
