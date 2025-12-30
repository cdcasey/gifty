import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";

const getUsers = createServerFn({ method: "GET" }).handler(async () => {
	const db = getDb(env);
	return await db.select().from(users);
});

export const Route = createFileRoute("/db-test")({
	loader: async () => await getUsers(),
	component: DbTest,
});

function DbTest() {
	const data = Route.useLoaderData();
	return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
