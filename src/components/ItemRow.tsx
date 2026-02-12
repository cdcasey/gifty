import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toggleDibs, deleteItem, importItemToShoppingList } from "@/lib/dibs";
import type { Item, Dibs, User } from "@/db/schema";
import { Trash2, ShoppingCart } from "lucide-react";

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
	const [isDeleting, setIsDeleting] = useState(false);
	const [isHidden, setIsHidden] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const isMyClaim = dibs?.user_id === currentUserId;

	const handleToggleDibs = async (status: "dibs" | "purchased" | null) => {
		await toggleDibs({ data: { item_id: item.id, status } });
		window.location.reload();
	};

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to delete this item?")) return;

		// Optimistic UI: hide immediately
		setIsDeleting(true);
		setIsHidden(true);

		try {
			await deleteItem({ data: item.id });
			// Success - item stays hidden
		} catch (error) {
			// Revert on error
			setIsHidden(false);
			setIsDeleting(false);
			alert("Failed to delete item. Please try again.");
		}
	};

	const handleImport = async () => {
		setIsImporting(true);
		try {
			await importItemToShoppingList({ data: { itemId: item.id } });
			alert("Item added to your Shopping List!");
		} catch (error) {
			alert("Failed to import item. Please try again.");
		} finally {
			setIsImporting(false);
		}
	};

	if (isHidden) {
		return null; // Optimistically hide the item
	}

	return (
		<TooltipProvider>
			<li className={`border-b py-3 hover:bg-muted/30 transition-all px-2 rounded ${isDeleting ? "opacity-50" : ""}`}>
				<div className="flex justify-between items-start gap-2">
					<div className="flex-1">
						<strong>{item.name}</strong>
						{item.priority === "high" && " ⭐"}
						{item.notes && (
							<p className="text-sm text-muted-foreground">{item.notes}</p>
						)}
						{item.url && (
							<a
								href={item.url}
								className="text-sm text-blue-500 hover:underline"
								target="_blank"
								rel="noopener noreferrer"
							>
								Link ↗
							</a>
						)}
					</div>

					<div className="flex items-center gap-2">
						{isOwner && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-destructive hover:bg-destructive/10"
										onClick={handleDelete}
										disabled={isDeleting}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Delete this item</p>
								</TooltipContent>
							</Tooltip>
						)}

						<div>
							{isOwner ? (
								// Owner view: show status with hover tooltip (no names to prevent spoilers)
								<Tooltip>
									<TooltipTrigger asChild>
										<div className="text-sm text-muted-foreground cursor-help">
											{dibs &&
												(dibs.status === "purchased" ? "✓ Purchased" : "👀 Claimed")}
										</div>
									</TooltipTrigger>
									{dibs && (
										<TooltipContent>
											<p>
												Someone has {dibs.status === "purchased" ? "purchased" : "claimed"} this item
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												(Name hidden to preserve the surprise!)
											</p>
										</TooltipContent>
									)}
								</Tooltip>
							) : (
								// Viewer view: show claim controls with hover info
								<div className="flex flex-col gap-2 items-end">
									{isMyClaim && (
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													className="h-7 gap-1 text-xs"
													onClick={handleImport}
													disabled={isImporting}
												>
													<ShoppingCart className="h-3 w-3" />
													{isImporting ? "Adding..." : "Add to Shopping List"}
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												<p>Copy this item to your Shopping List</p>
												<p className="text-xs text-muted-foreground">
													Keep track of what you need to buy
												</p>
											</TooltipContent>
										</Tooltip>
									)}

									{claimedBy && !isMyClaim ? (
										<Tooltip>
											<TooltipTrigger asChild>
												<span className="text-sm cursor-help">
													{dibs?.status === "purchased" ? "✓ Bought by" : "👀 Dibs by"}{" "}
													{claimedBy.name}
												</span>
											</TooltipTrigger>
											<TooltipContent>
												<p className="font-semibold">{claimedBy.name}</p>
												<p className="text-xs">
													{dibs?.status === "purchased"
														? "Has purchased this item"
														: "Has called dibs on this item"}
												</p>
											</TooltipContent>
										</Tooltip>
									) : !isMyClaim && (
										<div className="flex gap-2">
											<Tooltip>
												<TooltipTrigger asChild>
													<label className="flex items-center gap-1 text-sm cursor-pointer">
														<Checkbox
															checked={dibs?.status === "dibs"}
															onCheckedChange={(checked) =>
																handleToggleDibs(checked ? "dibs" : null)
															}
														/>
														Dibs
													</label>
												</TooltipTrigger>
												<TooltipContent>
													<p>Call dibs on this item</p>
													<p className="text-xs text-muted-foreground">Let others know you're planning to buy it</p>
												</TooltipContent>
											</Tooltip>

											<Tooltip>
												<TooltipTrigger asChild>
													<label className="flex items-center gap-1 text-sm cursor-pointer">
														<Checkbox
															checked={dibs?.status === "purchased"}
															onCheckedChange={(checked) =>
																handleToggleDibs(checked ? "purchased" : null)
															}
														/>
														Bought
													</label>
												</TooltipTrigger>
												<TooltipContent>
													<p>Mark as purchased</p>
													<p className="text-xs text-muted-foreground">Let others know you've bought it</p>
												</TooltipContent>
											</Tooltip>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			</li>
		</TooltipProvider>
	);
}
