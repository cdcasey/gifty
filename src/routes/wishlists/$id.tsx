import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { generateShareToken, getWishlistStats } from "@/lib/share";
import { archiveWishlist, unarchiveWishlist } from "@/lib/archive";

import { getDb } from "@/db/client";
import { items } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ItemRow } from "@/components/ItemRow";
import { getWishlistItemsWithDibs } from "@/lib/dibs";
import { Archive, ArchiveRestore, AlertCircle } from "lucide-react";

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
	const [stats, setStats] = useState<{ itemCount: number; viewerCount: number; shouldNudge: boolean } | null>(null);

	useEffect(() => {
		if (isOwner) {
			getWishlistStats({ data: wishlist.id }).then(setStats);
		}
	}, [wishlist.id, isOwner]);

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

	const handleArchive = async () => {
		if (!confirm("Archive this wishlist? It will be hidden but can be restored later.")) return;
		await archiveWishlist({ data: wishlist.id });
		window.location.href = "/dashboard";
	};

	const handleUnarchive = async () => {
		await unarchiveWishlist({ data: wishlist.id });
		window.location.reload();
	};

	const isExpired = wishlist.deadline && new Date(wishlist.deadline) < new Date();

	return (
		<div className="p-6">
			<Link to="/dashboard" className="text-blue-500 hover:underline">← back</Link>
			<div className="flex items-center gap-4 mt-4">
				<div className="flex-1">
					<h1 className="text-3xl font-bold">{wishlist.title}</h1>
					{wishlist.is_archived && (
						<span className="inline-flex items-center gap-1 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-2">
							<Archive className="h-3 w-3" />
							Archived
						</span>
					)}
					{isExpired && !wishlist.is_archived && (
						<span className="inline-flex items-center gap-1 text-sm bg-red-100 text-red-800 px-2 py-1 rounded mt-2">
							Expired
						</span>
					)}
					{wishlist.deadline && (
						<p className="text-sm text-muted-foreground mt-1">
							Deadline: {new Date(wishlist.deadline).toLocaleDateString()}
						</p>
					)}
				</div>
				{isOwner && (
					<div className="flex gap-2">
						<ShareButton wishlistId={wishlist.id} />
						{wishlist.is_archived ? (
							<Button variant="outline" onClick={handleUnarchive}>
								<ArchiveRestore className="h-4 w-4 mr-2" />
								Unarchive
							</Button>
						) : (
							<Button variant="outline" onClick={handleArchive}>
								<Archive className="h-4 w-4 mr-2" />
								Archive
							</Button>
						)}
					</div>
				)}
			</div>

			{/* Nudge for small lists with multiple viewers */}
			{isOwner && stats?.shouldNudge && (
				<Alert className="my-4 bg-blue-50 border-blue-200">
					<AlertCircle className="h-4 w-4 text-blue-600" />
					<AlertDescription className="text-blue-800">
						<strong>Tip:</strong> You've shared this wishlist with {stats.viewerCount} {stats.viewerCount === 1 ? "person" : "people"}, but only have {stats.itemCount} {stats.itemCount === 1 ? "item" : "items"}.
						Consider adding a few more items to give them more options!
					</AlertDescription>
				</Alert>
			)}

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
