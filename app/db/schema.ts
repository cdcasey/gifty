import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

// .$onUpdate(() => new Date()), tells Drizzle to silently
// intercepts the call and insert the current timestamp

export const users = sqliteTable("users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	email: text("email").notNull().unique(),
	name: text("name").notNull(),
	avatar_config: text("avatar_config", { mode: "json" }).$type<{
		emoji: string;
		color: string;
	}>(),
	created_at: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),

	updated_at: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date()),
});

export const wishlists = sqliteTable("wishlists", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	owner_id: text("owner_id")
		.notNull()
		.references(() => users.id),
	title: text("title").notNull(),
	deadline: integer("deadline", { mode: "timestamp" }),
	is_archived: integer("is_archived", { mode: "boolean" }).default(false),
	created_at: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updated_at: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date()),
});

export const items = sqliteTable("items", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	wishlist_id: text("wishlist_id")
		.notNull()
		.references(() => wishlists.id),
	name: text("name").notNull(),
	notes: text("notes"),
	url: text("url"),
	priority: text("priority", { enum: ["high", "normal"] })
		.notNull()
		.default("normal"),
	created_at: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updated_at: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date()),
});

export const books = sqliteTable("books", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	owner_id: text("owner_id")
		.notNull()
		.references(() => users.id),
	title: text("title").notNull(),
	cover_style: text("cover_style", {
		enum: ["leather", "fabric", "paper", "vintage"],
	})
		.notNull()
		.default("leather"),
	year: integer("year").notNull(),
	created_at: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updated_at: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date()),
});

export const bookEntries = sqliteTable("book_entries", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	book_id: text("book_id")
		.notNull()
		.references(() => books.id),
	wishlist_id: text("wishlist_id")
		.notNull()
		.references(() => wishlists.id),
	created_at: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updated_at: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date()),
});

export const dibs = sqliteTable("dibs", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	item_id: text("item_id")
		.notNull()
		.references(() => items.id),
	user_id: text("user_id")
		.notNull()
		.references(() => users.id),
	status: text("status", { enum: ["dibs", "purchased"] })
		.notNull()
		.default("dibs"),
	created_at: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updated_at: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type BookEntry = typeof bookEntries.$inferSelect;
export type NewBookEntry = typeof bookEntries.$inferInsert;
export type Dibs = typeof dibs.$inferSelect;
export type NewDibs = typeof dibs.$inferInsert;
