import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { books, bookEntries, wishlists, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

const getBookWithWishlists = createServerFn({ method: "GET" })
	.inputValidator((bookId: string) => bookId)
	.handler(async ({ data: bookId }) => {
		const user = await getCurrentUser();
		if (!user) throw new Error("Not authenticated");

		const db = getDb(env);

		// Get the book
		const [book] = await db
			.select()
			.from(books)
			.where(eq(books.id, bookId))
			.limit(1);

		if (!book) throw new Error("Book not found");
		if (book.owner_id !== user.id) throw new Error("Not your book");

		// Get all wishlists in this book with their owners
		const entries = await db
			.select({
				entry: bookEntries,
				wishlist: wishlists,
				owner: users,
			})
			.from(bookEntries)
			.innerJoin(wishlists, eq(bookEntries.wishlist_id, wishlists.id))
			.innerJoin(users, eq(wishlists.owner_id, users.id))
			.where(eq(bookEntries.book_id, bookId));

		return { book, entries };
	});

export const Route = createFileRoute("/books/$id" as any)({
	loader: ({ params }: any) => getBookWithWishlists({ data: params.id }),
	component: BookView,
});

function BookView() {
	const { book, entries } = Route.useLoaderData();

	if (entries.length === 0) {
		return (
			<div className="p-6">
				<Link to="/dashboard" className="text-blue-500 hover:underline">
					← Back to Dashboard
				</Link>
				<h1 className="text-2xl font-bold mt-4">{book.title}</h1>
				<p className="text-muted-foreground mt-2">
					This book is empty. Add wishlists from your shared lists.
				</p>
			</div>
		);
	}

	const defaultTab = "index";
	const [activeTab, setActiveTab] = React.useState(defaultTab);

	const coverClass = `book-cover-${book.cover_style}`;

	return (
		<div className="flex flex-col h-full bg-gradient-to-b from-gray-100 to-gray-200">
			{/* Book Header - Inside Cover */}
			<div className={`p-6 border-b-4 border-double ${coverClass}`}>
				<Link to="/dashboard" className="text-white/90 hover:text-white font-semibold">
					← Back to Dashboard
				</Link>
				<h1 className="text-3xl font-bold mt-3 mb-1 book-title-embossed text-white">
					{book.title}
				</h1>
				<p className="text-sm text-white/80 font-medium">
					{book.year} • {book.cover_style}
				</p>
			</div>

			<div className="flex-1 flex overflow-hidden book-spine">
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="flex-1 flex"
					orientation="vertical"
				>
					{/* Main content area - Book Pages */}
					<div className="flex-1 overflow-auto p-6 book-page">
						{/* Index/Table of Contents */}
						<TabsContent value="index" className="mt-0">
							<Card className="p-6">
								<h2 className="text-2xl font-bold mb-2">Table of Contents</h2>
								<p className="text-muted-foreground mb-6">
									This book contains {entries.length} wishlists from friends and family.
								</p>
								<div className="space-y-4">
									{entries.map((entry: any, idx: number) => (
										<div
											key={entry.wishlist.id}
											className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
											onClick={() => setActiveTab(entry.wishlist.id)}
										>
											<div className="flex items-start justify-between">
												<div>
													<h3 className="font-semibold text-lg">
														{idx + 1}. {entry.owner.name}
													</h3>
													<p className="text-sm text-muted-foreground">
														{entry.wishlist.title}
													</p>
													{entry.wishlist.deadline && (
														<p className="text-xs text-muted-foreground mt-1">
															Deadline: {new Date(entry.wishlist.deadline).toLocaleDateString()}
														</p>
													)}
												</div>
												<span className="text-blue-500">→</span>
											</div>
										</div>
									))}
								</div>
							</Card>
						</TabsContent>

						{/* Individual wishlist views */}
						{entries.map((entry: any) => (
							<TabsContent key={entry.wishlist.id} value={entry.wishlist.id} className="mt-0">
								<WishlistView wishlistId={entry.wishlist.id} ownerName={entry.owner.name} />
							</TabsContent>
						))}
					</div>

					{/* Tabs sidebar (right side) - Book Tabs */}
					<TabsList className="flex-col h-full w-48 border-l-4 book-tabs p-2 space-y-1 rounded-none shadow-inner">
						<TabsTrigger
							value="index"
							className="w-full justify-start data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
						>
							📑 Index
						</TabsTrigger>
						{entries.map((entry: any) => (
							<TabsTrigger
								key={entry.wishlist.id}
								value={entry.wishlist.id}
								className="w-full justify-start data-[state=active]:bg-white data-[state=active]:shadow-md transition-all truncate"
							>
								{entry.owner.name}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</div>
		</div>
	);
}

function WishlistView({
	wishlistId,
	ownerName,
}: {
	wishlistId: string;
	ownerName: string;
}) {
	return (
		<Card className="p-6">
			<h2 className="text-xl font-semibold mb-2">
				{ownerName}'s Wishlist
			</h2>
			<p className="text-sm text-muted-foreground mb-4">
				View items from {wishlistId}
			</p>
			<Link
				to="/wishlists/$id"
				params={{ id: wishlistId }}
				className="text-blue-500 hover:underline"
			>
				View full wishlist →
			</Link>
		</Card>
	);
}
