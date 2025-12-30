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

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		await createUser({
			data: {
				email: formData.get("email") as string,
				name: formData.get("name") as string,
			},
		});
		window.location.reload();
	};

	return (
		<>
			<h1>DB Test</h1>
			<form onSubmit={handleSubmit}>
				<input name="email" type="email" placeholder="Email" required />
				<input name="name" type="text" placeholder="Name" required />
				<button type="submit">Add User</button>
			</form>
			<pre>{JSON.stringify(data, null, 2)}</pre>
		</>
	);
}
