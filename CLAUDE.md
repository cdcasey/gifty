Use 'bd' for task tracking

# Project Plan: "The Gifting Book" (Family Wishlist App)

## I. Context & Role
Your Role: Senior Full-Stack Architect & Pair Programmer. My Role: Experienced Developer, but new to Tanstack Start. Goal: Build a "Cozy Web" family wishlist application where users curate "Books" of their friends' and family's wishlists. Tone: Collaborative, strictly typed, and focused on clean architecture.

## II. Technical Stack
* Runtime/Platform: Cloudflare Workers (Pages).
* Frontend Framework: Tanstack Start (React).
* Database: Cloudflare D1 (SQLite).
* ORM: Drizzle ORM (Essential for D1 + TypeScript typing).
* Styling: Tailwind CSS (with a focus on skeuomorphic/tactile design elements).
* Testing: Vitest (Unit & Integration).
* Language: TypeScript (Strict).

## III. Core Concept: "The Book"
The app uses a book metaphor.
* A List is a collection of items created by a User.
* A Book is a container/view owned by a User (e.g., "Christmas 2025").
* Users invite others to share lists. When accepted, the User places that List into a specific Book.
* Visuals: Navigation should feel like opening a drawer, selecting a book, and flipping tabs (handled via CSS/Tanstack transitions, not heavy physics engines).

## IV. Database Schema (D1 + Drizzle)

We need a relational structure to handle the "Dibs" system.
* Users: id, email, name, avatar_config (JSON for emoji/style).
* Wishlists: id, owner_id, title, deadline (for time-locking/archiving), is_archived.
* Items: id, wishlist_id, name, notes, url, priority (high/normal).
* Books: id, owner_id, title, cover_style (enum), year.
* BookEntries: id, book_id, wishlist_id (The link between a friend's list and your book).
* Dibs: id, item_id, user_id (the buyer), status (enum: 'dibs', 'purchased'), created_at.

## V. Critical Business Logic (The "Dibs" System)

This is the most complex logic feature and requires heavy testing.

1. Owner View:
* Can see if an item has dibs or purchased status.
* MUST NOT see user_id of the buyer (spoiler protection).
* Can toggle "Show Claimed" on/off.
2. Viewer (Friend) View:
* Can see distinct states: Available, Dibs (by whom), Purchased (by whom).
* Can toggle dibs status (Optimistic UI update required).
* Can "Import Dibs" (Copy item details to their own private "Shopping List" book section).
3. Time Locking: Lists have a "season." Old lists are archived, not deleted, to preserve history.
4. Math Constraints: Discarded. We will not enforce minimum item counts (e.g. 20 items), but we will implement UI "nudges" for small lists with high traffic.

## VI. Implementation Plan (The "Chunks")
Please guide me through this project in the following phases. Do not generate code for the whole app at once. Stop after each phase to allow for review, testing, and questions.

### Phase 1: The Skeleton & Infrastructure
* Initialize Tanstack Start with Cloudflare adapter.
* Set up Drizzle ORM with D1.
* Create the Schema migration files.
* Goal: A "Hello World" that writes a User to the DB and reads it back via a Tanstack Loader.

### Phase 2: Auth & Basic Lists (CRUD)
* Implement simple auth (Magic Link or Mock for now).
* Create/Edit Wishlists.
* Add Items to lists.
* Tanstack Learning Moment: Explain how createServerFn handles the form submissions.

### Phase 3: The "Book" & Sharing Logic
* Create Books.
* Invite system (generate share token -> accept -> add to Book).
* Testing Focus: Integration tests for the sharing permissions logic.

### Phase 4: The Dibs System (Complex State)
* Implement the Dibs table interactions.
* Handle the visibility logic (hiding spoilers from owners).
* UI Focus: Optimistic updates so clicking "Dibs" feels instant.

### Phase 5: The "Cozy" UI
* Implement the "Drawer" and "Book" CSS layout.
* Polish transitions.

## VII. Wireframes

### 1. The "Cozy" Navigation Structure
This wireframe visualizes the App Shell. In Tanstack Start, this maps to your root _layout.tsx. The "Drawer" is the persistent navigation, and the "Book" is the main content outlet.
```
graph TD
    subgraph "App Shell (_layout.tsx)"
        A[<b>Global Header</b><br/>Menu Icon (Hamburger) | User Avatar]

        subgraph "The Drawer (Sidebar)"
            B[<b>Drawer Container</b><br/><i>(Slide-in Animation)</i>]
            B1[<b>My Books Section</b><br/>- Christmas 2025<br/>- Birthdays]
            B2[<b>Incoming Shares</b><br/>- 'Mom shared 'Ideas' with you']
            B3[<b>Friends/Connections</b><br/>- List of accepted friends]
            B4[<b>App Settings</b>]
        end

        subgraph "Main Content Area (Outlet)"
            C{<b>State: Is Book Open?</b>}
            C -- No --> D[<b>Dashboard View</b><br/>Grid of Book Covers<br/>'Create New Book' Button]
            C -- Yes --> E[<b>The Book View</b><br/>(See Next Diagram)]
        end
    end

    A -- Click Menu --> B
    B1 -- Click Book --> E
```

### 2. "The Book" Interface

This is the core view. It requires a specific layout to feel like a physical object. The "Tabs" on the right allow quick switching between the different lists contained within that book.

```
graph TB
    subgraph "The Book Container (CSS Container Query)"
        direction TB

        Header[<b>Book Header (Inside Cover)</b><br/>Title: 'Christmas 2025'<br/>Action: Edit Book Settings]

        subgraph "Book Spread (Flex/Grid)"
            direction LR

            subgraph "Main Page Content (Scrollable)"
                P1[<b>Page: Table of Contents</b><br/>List of all friends in this book<br/>Quick links to their sections]
                P2[<b>Page: Friend's Wishlist</b><br/>User: 'Alice'<br/>Items List...]
                P3[<b>Page: My Shopping List</b><br/>Compiles all 'Dibs' from this book]
            end

            subgraph "Tabs (Right Sidebar)"
                T1[<b>Tab: Index</b>]
                T2[<b>Tab: Alice</b>]
                T3[<b>Tab: Bob</b>]
                T4[<b>Tab: Shop List</b>]
            end
        end
    end

    T1 --> P1
    T2 --> P2
    T4 --> P3

    style Header fill:#f9f,stroke:#333,stroke-width:2px
    style T2 fill:#ccf,stroke:#333
```

### 3. The "Item Row" & Dibs Logic
This is the most technically complex UI component because it changes completely based on User Context.
```
flowchart LR
    subgraph "Wishlist Item Component"
        direction TB

        Info[<b>Item Details</b><br/>Title: 'Flashlight'<br/>Notes: 'Rechargeable only'<br/>Link: Amazon URL]

        subgraph "Context: Who is viewing?"
            direction TB

            Owner[<b>I own this list</b>]
            Guest[<b>I am a friend</b>]

            subgraph "Owner Controls"
                O1[Edit Item]
                O2[Delete Item]
                O3[<b>Toggle: Reveal Spoilers</b><br/><i>'Has anyone bought this?'</i>]
                O4[Result: 'Status: 1 Dibs' (No Name)]
            end

            subgraph "Guest Controls"
                G1[<b>Checkbox: Dibs</b><br/><i>'I am buying this'</i>]
                G2[<b>Checkbox: Purchased</b><br/><i>'I already bought this'</i>]
                G3[<b>Import</b><br/>Add to my Shopping List]
                G4[<b>Hover Info</b><br/><i>'See who dibsed it'</i>]
            end
        end
    end

    Info --> Owner
    Info --> Guest
    Owner --> O1 & O2 & O3
    O3 -.-> O4
    Guest --> G1 & G2 & G3 & G4
```
