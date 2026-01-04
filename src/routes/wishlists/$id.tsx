import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { wishlists, items } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

const createItem = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			wishlist_id: string;
			name: string;
			notes?: string;
			url?: string;
			priority: "high" | "normal";
		}) => data,
	)
	.handler(async ({ data }) => {
		const db = getDb(env);
		const [newItem] = await db
			.insert(items)
			.values({
				wishlist_id: data.wishlist_id,
				name: data.name,
				notes: data.notes || null,
				url: data.url || null,
				priority: data.priority,
			})
			.returning();

		return newItem;
	});

export const Route = createFileRoute("/wishlists/$id")({
	loader: ({ params }) => getWishList({ data: params.id }),
	component: ViewWishlist,
});

function ViewWishlist() {
	const { wishlist, items } = Route.useLoaderData();

	const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		await createItem({
			data: {
				wishlist_id: wishlist.id,
				name: formData.get("name") as string,
				notes: formData.get("notes") as string,
				url: formData.get("url") as string,
				priority: formData.get("priority") as "high" | "normal",
			},
		});

		window.location.reload();
	};

	return (
		<div>
			<Link to="/dashboard">← back</Link>
			<h1>{wishlist.title}</h1>

			<form onSubmit={handleAddItem} className="space-y-3 my-4 max-w-md">
				<Input name="name" placeholder="Item name" required />
				<Textarea name="notes" placeholder="Notes (optional)" rows={2} />
				<Input name="url" type="url" placeholder="Link (optional)" />
				<RadioGroup
					name="priority"
					defaultValue="normal"
					className="flex gap-2 items-center"
				>
					<Label>
						<RadioGroupItem value="normal" defaultChecked /> Normal
					</Label>
					<Label>
						<RadioGroupItem value="high" /> High Priority ⭐
					</Label>
				</RadioGroup>
				<Button type="submit">Add Item</Button>
			</form>

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
