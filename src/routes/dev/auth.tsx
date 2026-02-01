import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { devLogin, getCurrentUser, logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const checkDevOnly = createServerFn({ method: "GET" }).handler(async () => {
	const url = getRequestUrl();
	const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
	return isLocal;
});

const getAllUsers = createServerFn({ method: "GET" }).handler(async () => {
	const db = getDb(env);
	return await db.select().from(users);
});

export const Route = createFileRoute("/dev/auth")({
	loader: async () => {
		const isLocal = await checkDevOnly();
		if (!isLocal) {
			throw notFound();
		}
		return {
			users: await getAllUsers(),
			currentUser: await getCurrentUser(),
		};
	},
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
