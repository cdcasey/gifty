Project Plan: "The Gifting Book" (Family Wishlist App)
1. Context & Role
Your Role: Senior Full-Stack Architect & Pair Programmer. My Role: Experienced Developer, but new to Tanstack Start. Goal: Build a "Cozy Web" family wishlist application where users curate "Books" of their friends' and family's wishlists. Tone: Collaborative, strictly typed, and focused on clean architecture.

2. Technical Stack
Runtime/Platform: Cloudflare Workers (Pages).

Frontend Framework: Tanstack Start (React).

Database: Cloudflare D1 (SQLite).

ORM: Drizzle ORM (Essential for D1 + TypeScript typing).

Styling: Tailwind CSS (with a focus on skeuomorphic/tactile design elements).

Testing: Vitest (Unit & Integration).

Language: TypeScript (Strict).

3. Core Concept: "The Book"
The app uses a book metaphor.

A List is a collection of items created by a User.

A Book is a container/view owned by a User (e.g., "Christmas 2025").

Users invite others to share lists. When accepted, the User places that List into a specific Book.

Visuals: Navigation should feel like opening a drawer, selecting a book, and flipping tabs (handled via CSS/Tanstack transitions, not heavy physics engines).

4. Database Schema (D1 + Drizzle)
We need a relational structure to handle the "Dibs" system.

Users: id, email, name, avatar_config (JSON for emoji/style).

Wishlists: id, owner_id, title, deadline (for time-locking/archiving), is_archived.

Items: id, wishlist_id, name, notes, url, priority (high/normal).

Books: id, owner_id, title, cover_style (enum), year.

BookEntries: id, book_id, wishlist_id (The link between a friend's list and your book).

Dibs: id, item_id, user_id (the buyer), status (enum: 'dibs', 'purchased'), created_at.

5. Critical Business Logic (The "Dibs" System)
This is the most complex logic feature and requires heavy testing.

Owner View:

Can see if an item has dibs or purchased status.

MUST NOT see user_id of the buyer (spoiler protection).

Can toggle "Show Claimed" on/off.

Viewer (Friend) View:

Can see distinct states: Available, Dibs (by whom), Purchased (by whom).

Can toggle dibs status (Optimistic UI update required).

Can "Import Dibs" (Copy item details to their own private "Shopping List" book section).

Time Locking: Lists have a "season." Old lists are archived, not deleted, to preserve history.

Math Constraints: Discarded. We will not enforce minimum item counts (e.g. 20 items), but we will implement UI "nudges" for small lists with high traffic.

6. Implementation Plan (The "Chunks")
Please guide me through this project in the following phases. Do not generate code for the whole app at once. Stop after each phase to allow for review, testing, and questions.

Phase 1: The Skeleton & Infrastructure
Initialize Tanstack Start with Cloudflare adapter.

Set up Drizzle ORM with D1.

Create the Schema migration files.

Goal: A "Hello World" that writes a User to the DB and reads it back via a Tanstack Loader.

Phase 2: Auth & Basic Lists (CRUD)
Implement simple auth (Magic Link or Mock for now).

Create/Edit Wishlists.

Add Items to lists.

Tanstack Learning Moment: Explain how createServerFn handles the form submissions.

Phase 3: The "Book" & Sharing Logic
Create Books.

Invite system (generate share token -> accept -> add to Book).

Testing Focus: Integration tests for the sharing permissions logic.

Phase 4: The Dibs System (Complex State)
* Implement the Dibs table interactions.
* Handle the visibility logic (hiding spoilers from owners).
* UI Focus: Optimistic updates so clicking "Dibs" feels instant.

Phase 5: The "Cozy" UI
* Implement the "Drawer" and "Book" CSS layout.
* Polish transitions.
