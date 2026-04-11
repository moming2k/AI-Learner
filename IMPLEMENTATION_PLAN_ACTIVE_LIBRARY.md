# Active Library Implementation Plan

## Goal

Allow each authenticated user to have a persisted `activeLibraryId` for NotebookLM / library-targeted actions.

Rules:
- On account creation, automatically assign the user's personal library and save it as `activeLibraryId`.
- Existing users without `activeLibraryId` must be backfilled.
- Users can later switch to another available library.
- This change does **not** move pages between libraries.
- This change does **not** implement multi-user shared libraries.

## Product behavior

1. Every user should end up with a real saved `activeLibraryId`.
2. New users get `activeLibraryId` assigned automatically during auth/session creation.
3. Existing users get `activeLibraryId` assigned by backfill / runtime repair.
4. Header UI shows the current active library.
5. User can open a selector and choose a different library.
6. Current notes pages remain in the user's assigned personal database. We are only adding a selected target library concept for future NotebookLM-facing actions.

## Data model

Add a global app database for cross-user metadata:
- `${AI_LEARNER_DATA_DIR}/wiki-app.db`

Table:
- `user_library_preferences`
  - `auth_user_id TEXT PRIMARY KEY`
  - `active_library_id TEXT NOT NULL`
  - `active_library_name TEXT`
  - `personal_library_id TEXT NOT NULL`
  - `personal_library_name TEXT`
  - `created_at INTEGER NOT NULL`
  - `updated_at INTEGER NOT NULL`

Rationale:
- Per-user wiki content already lives in per-user DBs.
- Active library preference is cross-user account metadata, so it should live in one global app DB.
- All DBs must live in `AI_LEARNER_DATA_DIR` outside the app repo. There is no fallback to `process.cwd()/data`.

## Library model (v1)

For now, available libraries are derived locally:
- The user's assigned personal library is always available.
- Additional libraries can be introduced later by extending the listing source.

Initial behavior:
- `personal:<databaseKey>` is the default personal library id.
- Name shown in UI defaults to `Personal library`.

This gives us a stable active-library system now, while leaving room to plug in a richer external library source later.

## Backend changes

### 1. Add global user-library preference store

Create `lib/user-library-preferences.ts` to:
- open/create `wiki-app.db`
- initialize `user_library_preferences`
- provide:
  - `getUserLibraryPreference(authUserId)`
  - `upsertUserLibraryPreference(...)`
  - `ensureUserActiveLibrary(user)`
  - `listAvailableLibrariesForUser(user)`
  - `setUserActiveLibrary(user, libraryId)`
  - `backfillMissingActiveLibraries()`

### 2. Auto-assign on auth callback

In `app/api/auth/callback/route.ts`:
- after callback verification and before redirect completes,
- call `ensureUserActiveLibrary(user)`

This guarantees newly created / newly seen users get an assigned `activeLibraryId`.

### 3. Runtime safety net

Where current user context is loaded for library operations, call `ensureUserActiveLibrary(user)` if needed.

### 4. Add API routes

#### GET `/api/libraries`
Returns:
- `libraries`
- `activeLibraryId`
- `activeLibraryName`
- `personalLibraryId`

#### POST `/api/libraries/active`
Input:
```json
{ "libraryId": "personal:<databaseKey>" }
```

Behavior:
- validate the target library is selectable for the current user
- persist as the new active library
- return the updated active library

### 5. Optional backfill script

Add a small script to backfill existing users if desired later, but runtime repair + auth callback assignment already cover correctness.

## Frontend changes

### 1. Replace static `DatabaseSelector`

Current component is a static badge saying `Personal library`.

Replace it with a client selector that:
- loads current library from `/api/libraries`
- displays current library name
- offers a `Change` action
- opens a small modal/panel listing available libraries
- saves selection through `/api/libraries/active`

### 2. UX behavior

- Loading state: `Library…`
- Success toast after switching library
- Graceful error toast if load/save fails

### 3. No page migration

Switching active library does **not** move any wiki pages.
It only changes the selected target library state for future integrations.

## Rollout order

1. Add global preference storage and helper functions.
2. Auto-assign on auth callback.
3. Add list/update library APIs.
4. Replace static header badge with active-library selector.
5. Build and verify.

## Acceptance criteria

- New authenticated users automatically get a saved `activeLibraryId`.
- Existing users without one are auto-repaired when seen again.
- Header shows the resolved active library.
- User can create an extra library from the UI.
- User can switch active library from the UI.
- Selection persists across refresh/login.
- Main notes data APIs resolve against the selected active library.
- Switching libraries changes active database context without migrating pages.

## Non-goals

- Moving pages between libraries
- Shared libraries across users
- Invitation/permission system
- Real-time collaboration
