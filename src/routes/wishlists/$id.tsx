import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { generateShareToken } from "@/lib/share";

import { getDb } from "@/db/client";
import { items } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ItemRow } from "@/components/ItemRow";
import { getWishlistItemsWithDibs } from "@/lib/dibs";

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
	loader: ({ params }) => getWishlistItemsWithDibs({ data: params.id }),
	component: ViewWishlist,
});

function ShareButton({ wishlistId }: { wishlistId: string }) {
	const [copied, setCopied] = useState(false);

	const handleShare = async () => {
		const { token } = await generateShareToken({ data: wishlistId });
		const url = `${window.location.origin}/share/${token}`;
		await navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Button variant="outline" onClick={handleShare}>
			{copied ? "Copied!" : "Share"}
		</Button>
	);
}

function ViewWishlist() {
	const { wishlist, items, isOwner, currentUserId } = Route.useLoaderData();

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
			<div className="flex items-center gap-4">
				<h1>{wishlist.title}</h1>
				{isOwner && <ShareButton wishlistId={wishlist.id} />}
			</div>

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
				<ul className="list-none p-0">
					{items.map((row) => (
						<ItemRow
							key={row.item.id}
							item={row.item}
							dibs={row.dibs}
							claimedBy={row.claimedBy}
							isOwner={isOwner}
							currentUserId={currentUserId}
						/>
					))}
				</ul>
			)}
		</div>
	);
}
