import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { wishlists } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const getMyWishlists = createServerFn({ method: "GET" }).handler(async () => {
	const user = await getCurrentUser();
	if (!user) throw redirect({ to: "/dev/auth" });

	const db = getDb(env);
	const myWishlists = await db
		.select()
		.from(wishlists)
		.where(eq(wishlists.owner_id, user.id));

	return { user, wishlists: myWishlists };
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
	const { user, wishlists } = Route.useLoaderData();

	const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const title = formData.get("title") as string;

		await createWishlist({ data: { title } });
		window.location.reload();
	};

	return (
		<div>
			<h1>{user.name}'s Wishlists</h1>

			<form onSubmit={handleCreate} className="flex gap-2 my-4">
				<Input
					name="title"
					placeholder="New wishlist name"
					required
					className="max-w-sm"
				/>
				<Button type="submit">Create Wishlist</Button>
			</form>

			{wishlists.length === 0 ? (
				<p>No wishlists yet.</p>
			) : (
				<ul>
					{wishlists.map((list) => (
						<li key={list.id}>
							<Link to="/wishlists/$id" params={{ id: list.id }}>
								{list.title}
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
