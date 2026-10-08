# Supabase Setup

This document describes the current state of Supabase in this repository and the steps required to initialise it locally.

## Current state

Supabase is not initialised in-tree. The `apps/backend/supabase/` directory contains exactly one file:

```
apps/backend/supabase/.gitignore
```

There are no migrations, `seed.sql`, or `config.toml` committed to the repository. The root `.gitignore` ignores `**/supabase/config.toml`, so `config.toml` is never committed even after you run `supabase init`.

## Initialising Supabase

Run the following from `apps/backend/`:

```
cd apps/backend
npx supabase init
```

This creates the following files and directories under `apps/backend/supabase/`:

```
apps/backend/supabase/
├── .gitignore
├── config.toml   (ignored by the root .gitignore)
├── migrations/
└── seed.sql
```

Note that `config.toml` is gitignored by the root `.gitignore` (`**/supabase/config.toml`) and will not be committed.

## Scripts

The following scripts are defined in `apps/backend/package.json`:

```
npm run supabase:start
npm run supabase:stop
```

Refer to `apps/backend/package.json` for the authoritative list of scripts and their exact names.
