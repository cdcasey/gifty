import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { devLogin, getCurrentUser, logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const getAllUsers = createServerFn({ method: "GET" }).handler(async () => {
	const db = getDb(env);
	return await db.select().from(users);
});

export const Route = createFileRoute("/dev/auth")({
	loader: async () => ({
		users: await getAllUsers(),
		currentUser: await getCurrentUser(),
	}),
	component: DevAuth,
});

function DevAuth() {
	const { users, currentUser } = Route.useLoaderData();
	console.log("RENDER");
	const handleSelect = async (userId: string) => {
		await devLogin({ data: { userId } });
		window.location.reload();
	};

	const handleLogout = async () => {
		await logout();
		window.location.reload();
	};

	return (
		<div>
			<h1>Dev Auth</h1>
			<p>Current: {currentUser?.name ?? "None"}</p>
			{currentUser && (
				<Button onClick={handleLogout} variant="outline" className="mb-4">
					Logout
				</Button>
			)}
			<ul>
				{users.map((user) => (
					<li key={user.id}>
						{user.name} ({user.email})
						<Button onClick={() => handleSelect(user.id)} className="ml-4">
							Login as
						</Button>
					</li>
				))}
			</ul>
		</div>
	);
}
