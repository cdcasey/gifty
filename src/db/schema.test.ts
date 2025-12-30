import { users, wishlists, items, type NewUser } from "./schema";

describe("Database schema", () => {
	it("should have correct table names", () => {
		expect(users).toBeDefined();
		expect(wishlists).toBeDefined();
		expect(items).toBeDefined();
	});

	it("should infer types correctly", () => {
		const newUser: NewUser = {
			email: "test@example.com",
			name: "Test User",
			avatar_config: { emoji: "👤", color: "blue" },
		};

		expect(newUser.email).toBe("test@example.com");
		expect(newUser.name).toBe("Test User");
	});
});
