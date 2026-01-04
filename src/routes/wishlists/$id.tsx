import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wishlists, items } from "@/db/schema";

const getWishList = createServerFn({ method: "GET" })
	.inputValidator((id: string) => id)
	.handler(async ({ data: id }) => {
		const db = getDb(env);

		const [wishlist] = await db
			.select()
			.from(wishlists)
			.where(eq(wishlists.id, id))
			.limit(1);

		if (!wishlist) throw new Error("Wishlist not found");

		const wishlistItems = await db
			.select()
			.from(items)
			.where(eq(items.wishlist_id, id));

		return { wishlist, items: wishlistItems };
	});

export const Route = createFileRoute("/wishlists/$id")({
	loader: ({ params }) => getWishList({ data: params.id }),
	component: ViewWishlist,
});

function ViewWishlist() {
	const { wishlist, items } = Route.useLoaderData();

	return (
		<div>
			<Link to="/dashboard">← back</Link>
			<h1>{wishlist.title}</h1>
			{items.length === 0 ? (
				<p>No items yet.</p>
			) : (
				<ul>
					{items.map((item) => (
						<li key={item.id}>
							<strong>{item.name}</strong>
							{item.priority === "high" && " ⭐"}
							{item.notes && <p>{item.notes}</p>}
							{item.url && <a href={item.url}>Link</a>}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
