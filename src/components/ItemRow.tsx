import { Checkbox } from "@/components/ui/checkbox";
import { toggleDibs } from "@/lib/dibs";
import type { Item, Dibs, User } from "@/db/schema";

type ItemRowProps = {
	item: Item;
	dibs: Dibs | null;
	claimedBy: User | null;
	isOwner: boolean;
	currentUserId: string;
};

export function ItemRow({
	item,
	dibs,
	claimedBy,
	isOwner,
	currentUserId,
}: ItemRowProps) {
	const isMyClaim = dibs?.user_id === currentUserId;

	const handleToggleDibs = async (status: "dibs" | "purchased" | null) => {
		await toggleDibs({ data: { item_id: item.id, status } });
		window.location.reload();
	};

	return (
		<li className="border-b py-3">
			<div className="flex justify-between items-start">
				<div>
					<strong>{item.name}</strong>
					{item.priority === "high" && " ⭐"}
					{item.notes && (
						<p className="text-sm text-muted-foreground">{item.notes}</p>
					)}
					{item.url && (
						<a
							href={item.url}
							className="text-sm text-blue-500 hover:underline"
						>
							Link
						</a>
					)}
				</div>

				{isOwner ? (
					// Owner view: just show if claimed (no names)
					<div className="text-sm text-muted-foreground">
						{dibs &&
							(dibs.status === "purchased" ? "✓ Purchased" : "👀 Claimed")}
					</div>
				) : (
					// Viewer view: show claim controls
					<div className="flex flex-col gap-1 items-end">
						{claimedBy && !isMyClaim ? (
							<span className="text-sm">
								{dibs?.status === "purchased" ? "Bought by" : "Dibs by"}{" "}
								{claimedBy.name}
							</span>
						) : (
							<div className="flex gap-2">
								<label className="flex items-center gap-1 text-sm">
									<Checkbox
										checked={dibs?.status === "dibs"}
										onCheckedChange={(checked) =>
											handleToggleDibs(checked ? "dibs" : null)
										}
									/>
									Dibs
								</label>
								<label className="flex items-center gap-1 text-sm">
									<Checkbox
										checked={dibs?.status === "purchased"}
										onCheckedChange={(checked) =>
											handleToggleDibs(checked ? "purchased" : null)
										}
									/>
									Bought
								</label>
							</div>
						)}
					</div>
				)}
			</div>
		</li>
	);
}
