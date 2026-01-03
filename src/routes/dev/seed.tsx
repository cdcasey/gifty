import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { getDb } from "@/db/client";
import { users, wishlists, items, books, bookEntries } from "@/db/schema";
import { Button } from "@/components/ui/button";

const seedDatabase = createServerFn({ method: "POST" }).handler(async () => {
	const db = getDb(env);

	// Create users
	const [alice, bob, carol] = await db
		.insert(users)
		.values([
			{
				email: "alice@example.com",
				name: "Alice",
				avatar_config: { emoji: "👩", color: "pink" },
			},
			{
				email: "bob@example.com",
				name: "Bob",
				avatar_config: { emoji: "👨", color: "blue" },
			},
			{
				email: "carol@example.com",
				name: "Carol",
				avatar_config: { emoji: "👩‍🦰", color: "green" },
			},
		])
		.returning();

	// Create wishlists
	const [aliceList, bobList] = await db
		.insert(wishlists)
		.values([
			{ owner_id: alice.id, title: "Alice's Birthday Wishes" },
			{ owner_id: bob.id, title: "Bob's Holiday List" },
		])
		.returning();

	// Create items
	await db.insert(items).values([
		{ wishlist_id: aliceList.id, name: "Kindle Paperwhite", priority: "high", url: "https://amazon.com/kindle" },
		{ wishlist_id: aliceList.id, name: "Cozy blanket", priority: "normal", notes: "Any earth tones" },
		{ wishlist_id: bobList.id, name: "Board game: Wingspan", priority: "high" },
		{ wishlist_id: bobList.id, name: "Coffee subscription", priority: "normal" },
	]);

	return { users: [alice, bob, carol], wishlists: [aliceList, bobList] };
});

export const Route = createFileRoute("/dev/seed")({
	component: DevSeed,
});

function DevSeed() {
	const handleSeed = async () => {
		const result = await seedDatabase();
		console.log("seeded:", result);
		alert("Database seeded! Check console.");
	};

	return (
		<div>
			<h1>Seed Database</h1>
			<Button onClick={handleSeed}>Seed Users</Button>
		</div>
	);
}
