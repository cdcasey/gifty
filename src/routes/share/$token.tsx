import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";

import { Button } from "@/components/ui/button";
import { getDb } from "@/db/client";
import { users, wishlists } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { acceptShare } from "@/lib/share";

const getSharePreview = createServerFn({ method: "GET" })
	.inputValidator((token: string) => token)
	.handler(async ({ data: token }) => {
		const currentUser = await getCurrentUser();

		const db = getDb(env);
		const [wishlist] = await db
			.select({ wishlist: wishlists, owner: users })
			.from(wishlists)
			.innerJoin(users, eq(wishlists.owner_id, users.id))
			.where(eq(wishlists.share_token, token))
			.limit(1);

		if (!wishlist) throw new Error("Invalid share link");

		return {
			wishlist: wishlist.wishlist,
			owner: wishlist.owner,
			isLoggedIn: !!currentUser,
			isOwnList: currentUser?.id === wishlist.owner.id,
		};
	});

export const Route = createFileRoute("/share/$token")({
	loader: ({ params }) => getSharePreview({ data: params.token }),
	component: SharePage,
});

function SharePage() {
	const { wishlist, owner, isLoggedIn, isOwnList } = Route.useLoaderData();
	const { token } = Route.useParams();

	const handleAccept = async () => {
		await acceptShare({ data: token });
		window.location.href = "/dashboard";
	};

	return (
		<div className="mx-auto mt-10 max-w-md p-6">
			<h1 className="mb-4 text-2xl font-bold">{wishlist.title}</h1>
			<p className="text-muted-foreground mb-6">Shared by {owner.name}</p>

			{isOwnList ? (
				<p>This is your own wishlist.</p>
			) : !isLoggedIn ? (
				<div>
					<p className="mb-4">Log in to add this wishlist to your dashboard.</p>
					<Link to="/dev/auth">
						<Button>Log in</Button>
					</Link>
				</div>
			) : (
				<Button onClick={handleAccept}>Add to My Dashboard</Button>
			)}
		</div>
	);
}

// To resume: Finish invite system—add Share button to wishlist view, show shared lists on dashboard.
