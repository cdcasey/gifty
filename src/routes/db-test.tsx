import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";

const getUsers = createServerFn({ method: "GET" }).handler(async () => {
	const db = getDb(env);
	return await db.select().from(users);
});

const createUser = createServerFn({ method: "POST" })
	.inputValidator((data: { email: string; name: string }) => data)
	.handler(async ({ data }) => {
		const db = getDb(env);
		await db.insert(users).values({
			email: data.email,
			name: data.name,
			avatar_config: { emoji: "👤", color: "blue" },
		});
	});

export const Route = createFileRoute("/db-test")({
	loader: async () => await getUsers(),
	component: DbTest,
});

function DbTest() {
	const data = Route.useLoaderData();
	return (
		<>
			<form></form>
			<pre>{JSON.stringify(data, null, 2)}</pre>
		</>
	);
}
