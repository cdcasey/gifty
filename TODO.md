  Logical next steps (Phase 2: Auth & Basic Lists):
  1. Mock Auth (gifty-brq) - Test with multiple users without real auth
  2. Wishlist CRUD (gifty-mi1) - Create wishlists
  3. Item CRUD (gifty-zue) - Add items to wishlists
  4. Seed Data (gifty-far) - Populate DB for testing
  
# TODO: The Gifting Book

## Phase 1: Initialization & Infrastructure
- [ ] Initialize new Tanstack Start project with Cloudflare adapter
- [ ] Install Drizzle ORM, Drizzle Kit, and Cloudflare Types
- [ ] Configure `wrangler.toml` with D1 database binding
- [ ] Configure `drizzle.config.ts` and set up the `db/schema.ts` file
- [ ] Create a "Health Check" API route or Loader that performs a simple SELECT 1 from D1 to verify connection
- [ ] Set up Vitest with a basic "truthy" test to ensure test runner is working

## Phase 2: Core Schema & User Basics
- [ ] Define `users` table in Drizzle schema and generate migration
- [ ] Define `wishlists` and `items` tables in Drizzle schema and generate migration
- [ ] Create a `seed.ts` script to populate local D1 with dummy data
- [ ] Create a Mock Auth middleware (middleware.ts) that hardcodes a specific User ID for dev purposes
- [ ] Build the "Dashboard" route (Loader) that fetches the current user's Wishlists

## Phase 3: Wishlist Management (Tanstack Start Patterns)
- [ ] Create a Server Function (`createServerFn`) for creating a new Wishlist
- [ ] Create the "Create Wishlist" Form UI using Tanstack Form (or standard HTML forms)
- [ ] Create a Server Function for adding an Item to a Wishlist
- [ ] Create the "View Wishlist" route (Loader) listing all items
- [ ] Implement "Delete Item" with Optimistic UI updates

## Phase 4: The "Book" Metaphor (Data Structure)
- [ ] Define `books` and `book_entries` tables in Drizzle (Relation: Book -> many Lists)
- [ ] Run migrations and update seed data with Books
- [ ] Create Server Function to "Add Friend's List to My Book"
- [ ] Build the "My Books" Drawer UI (Sidebar navigation component)
- [ ] Implement the Book View: Tabs for different lists inside a single Book

## Phase 5: The "Dibs" Logic (Complex State)
- [ ] Define `dibs` table in Drizzle (linking User + Item)
- [ ] Implement `getWishlistItems` helper that conditionally hides `dibs.user_id` if the viewer is the list owner
- [ ] Create Server Function for `toggleDibs`
- [ ] Implement Frontend Component for Item Row: Handles "Available", "Dibsed", and "Purchased" states
- [ ] Add visual indicator for "Who dibsed this" (hover state, visible only to non-owners)

## Phase 6: Cozy UI & Polish
- [ ] Implement CSS for the "Drawer" open/close animation
- [ ] Style the Book container (shadows, rounded corners) to look tactile
- [ ] Add "Table of Contents" index page to the front of every Book
- [ ] Add "Import Dibs" feature (Server Fn: Copy item data to my own 'Shopping List' book)
