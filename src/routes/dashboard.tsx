import { useState } from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { eq, and } from "drizzle-orm";

import { getDb } from "@/db/client";
import { wishlists } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getSharedWishlists } from "@/lib/share";
import { getUserBooks, createBook, addWishlistToBook } from "@/lib/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const getMyWishlists = createServerFn({ method: "GET" }).handler(async () => {
	const user = await getCurrentUser();
	if (!user) throw redirect({ to: "/dev/auth" });

	const db = getDb(env);

	// Get active wishlists
	const myWishlists = await db
		.select()
		.from(wishlists)
		.where(
			and(
				eq(wishlists.owner_id, user.id),
				eq(wishlists.is_archived, false)
			)
		);

	// Get archived wishlists separately
	const archivedWishlists = await db
		.select()
		.from(wishlists)
		.where(
			and(
				eq(wishlists.owner_id, user.id),
				eq(wishlists.is_archived, true)
			)
		);

	const sharedWithMe = await getSharedWishlists();
	const books = await getUserBooks();

	return { user, wishlists: myWishlists, archivedWishlists, sharedWithMe, books };
});

const createWishlist = createServerFn({ method: "POST" })
	.inputValidator((data: { title: string }) => data)
	.handler(async ({ data }) => {
		const user = await getCurrentUser();
		if (!user) throw new Error("Not authenticated");

		const db = getDb(env);
		const [newList] = await db
			.insert(wishlists)
			.values({
				owner_id: user.id,
				title: data.title,
			})
			.returning();

		return newList;
	});

export const Route = createFileRoute("/dashboard")({
	loader: () => getMyWishlists(),
	component: Dashboard,
});

function Dashboard() {
	const { user, wishlists, archivedWishlists, sharedWithMe, books } = Route.useLoaderData();
	const [showArchived, setShowArchived] = useState(false);

	const handleCreateWishlist = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const title = formData.get("title") as string;

		await createWishlist({ data: { title } });
		window.location.reload();
	};

	const handleCreateBook = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const title = formData.get("title") as string;
		const year = parseInt(formData.get("year") as string);
		const cover_style = formData.get("cover_style") as any;

		await createBook({ data: { title, year, cover_style } });
		window.location.reload();
	};

	const handleAddToBook = async (wishlistId: string, bookId: string) => {
		await addWishlistToBook({ data: { bookId, wishlistId } });
		window.location.reload();
	};

	return (
		<div className="p-6 space-y-8">
			<h1 className="text-3xl font-bold">{user.name}'s Dashboard</h1>

			{/* Books Section */}
			<Card>
				<CardHeader>
					<CardTitle>My Books</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<form onSubmit={handleCreateBook} className="flex gap-2">
						<Input
							name="title"
							placeholder="Book title (e.g., Christmas 2025)"
							required
							className="max-w-sm"
						/>
						<Input
							name="year"
							type="number"
							placeholder="Year"
							defaultValue={new Date().getFullYear()}
							required
							className="w-24"
						/>
						<Button type="submit">Create Book</Button>
					</form>

					{books.length === 0 ? (
						<p className="text-muted-foreground">No books yet. Create one to organize your wishlists!</p>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{books.map((book) => (
								<a
									key={book.id}
									href={`/books/${book.id}`}
									className={`book-cover book-cover-${book.cover_style} rounded-lg p-6 block min-h-[140px] flex flex-col justify-center`}
								>
									<h3 className="font-bold text-xl text-white book-title-embossed">{book.title}</h3>
									<p className="text-sm text-white/80 mt-2 font-semibold">{book.year}</p>
								</a>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Wishlists Section */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>My Wishlists</CardTitle>
					{archivedWishlists.length > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowArchived(!showArchived)}
						>
							{showArchived ? "Hide" : "Show"} Archived ({archivedWishlists.length})
						</Button>
					)}
				</CardHeader>
				<CardContent className="space-y-4">
					<form onSubmit={handleCreateWishlist} className="flex gap-2">
						<Input
							name="title"
							placeholder="New wishlist name"
							required
							className="max-w-sm"
						/>
						<Button type="submit">Create Wishlist</Button>
					</form>

					{wishlists.length === 0 && !showArchived ? (
						<p className="text-muted-foreground">No active wishlists yet.</p>
					) : (
						<>
							<div>
								<h3 className="font-semibold mb-2">Active Wishlists</h3>
								<ul className="space-y-2">
									{wishlists.map((list) => (
										<li key={list.id} className="flex items-center justify-between border-b pb-2">
											<Link to="/wishlists/$id" params={{ id: list.id }} className="text-blue-500 hover:underline">
												{list.title}
											</Link>
										</li>
									))}
								</ul>
							</div>

							{showArchived && archivedWishlists.length > 0 && (
								<div className="mt-4 pt-4 border-t">
									<h3 className="font-semibold mb-2 text-muted-foreground">Archived Wishlists</h3>
									<ul className="space-y-2">
										{archivedWishlists.map((list) => (
											<li key={list.id} className="flex items-center justify-between border-b pb-2 opacity-60">
												<Link to="/wishlists/$id" params={{ id: list.id }} className="text-blue-500 hover:underline">
													{list.title}
												</Link>
											</li>
										))}
									</ul>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Shared with Me Section */}
			{sharedWithMe.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Shared with Me</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-3">
							{sharedWithMe.map(({ wishlist, owner }) => (
								<li key={wishlist.id} className="flex items-center justify-between border-b pb-2">
									<div>
										<Link to="/wishlists/$id" params={{ id: wishlist.id }} className="text-blue-500 hover:underline">
											{wishlist.title}
										</Link>
										<span className="text-muted-foreground ml-2 text-sm">
											by {owner.name}
										</span>
									</div>
									{books.length > 0 && (
										<div className="flex gap-2 items-center">
											<Select onValueChange={(bookId) => handleAddToBook(wishlist.id, bookId)}>
												<SelectTrigger className="w-[180px]">
													<SelectValue placeholder="Add to book..." />
												</SelectTrigger>
												<SelectContent>
													{books.map((book) => (
														<SelectItem key={book.id} value={book.id}>
															{book.title}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									)}
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
