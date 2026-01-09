# Database Migrations Guide

This project uses **golang-migrate/migrate** for database schema management.

## Quick Start

Migrations run **automatically on startup** when you start the API server. No manual steps required!

```bash
go run ./cmd/api
# Migrations applied automatically ✅
```

## Installation

### CLI Tool (Recommended)

Install the CLI tool to create and manage migrations:

```bash
# macOS
brew install golang-migrate

# Or via Go
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

The Go library is already installed in the project.

## How It Works

1. Connects to the database
2. Checks for pending migrations in `migrations/` directory
3. Applies any new migrations in chronological order
4. Tracks applied migrations in `schema_migrations` table (managed by golang-migrate)

**Migrations run automatically on startup** - no manual intervention needed.

## Creating New Migrations

### Using CLI Tool (Recommended)

```bash
cd apps/api

# Create new migration (uses timestamp automatically)
migrate create -ext sql -dir migrations add_user_id

# This creates:
# migrations/{timestamp}_add_user_id.up.sql
# migrations/{timestamp}_add_user_id.down.sql
```

**Note:** Without `-seq` flag, golang-migrate uses timestamps automatically (recommended).

### Manual Creation

Create two files with timestamp prefix:

1. `migrations/{timestamp}_{description}.up.sql` - Migration to apply
2. `migrations/{timestamp}_{description}.down.sql` - Migration to rollback

**Naming convention:** `{timestamp}_{description}.{up|down}.sql`

**Generate timestamp:**
```bash
date +%Y%m%d%H%M%S
# Example output: 20240108130000
```

**Example:**
- `migrations/20240108130000_add_user_id.up.sql`
- `migrations/20240108130000_add_user_id.down.sql`

## Migration Files

### Up Migration (Apply)

```sql
-- migrations/20240108130000_add_user_id.up.sql
ALTER TABLE tool_calls ADD COLUMN user_id UUID;
CREATE INDEX idx_tool_calls_user_id ON tool_calls(user_id);
```

### Down Migration (Rollback)

```sql
-- migrations/20240108130000_add_user_id.down.sql
DROP INDEX IF EXISTS idx_tool_calls_user_id;
ALTER TABLE tool_calls DROP COLUMN IF EXISTS user_id;
```

**Important:** Always create both up and down migrations for rollback support.

## Manual Migration Commands

You can run migrations manually using the CLI tool:

```bash
cd apps/api

# Set database URL (or use environment variable)
export DATABASE_URL="postgres://nous:nous@localhost:5432/nous?sslmode=disable"

# Run all pending migrations
migrate -path migrations -database "$DATABASE_URL" up

# Rollback one migration
migrate -path migrations -database "$DATABASE_URL" down 1

# Rollback all migrations
migrate -path migrations -database "$DATABASE_URL" down

# Check current migration version
migrate -path migrations -database "$DATABASE_URL" version

# Force version (if migration is stuck)
migrate -path migrations -database "$DATABASE_URL" force {version}
```

## Current Migrations

- `20240108120000_initial_schema.up.sql` - Creates TimescaleDB extension, tool_calls table, and indexes
- `20240108120000_initial_schema.down.sql` - Drops table and indexes

## Best Practices

1. **Always create both up and down migrations** - Enables rollback
2. **Test migrations** - Test both up and down on a copy of production data
3. **Use transactions** - golang-migrate runs each migration in a transaction automatically
4. **Version control** - Commit migration files to git
5. **Never edit applied migrations** - Create new migrations instead
6. **Use descriptive names** - Make it clear what the migration does
7. **Keep migrations small** - One logical change per migration

## Troubleshooting

### Migration Already Applied

If you see "no change" message, migrations are already up to date. This is normal and expected.

### Migration Failed

1. Check database logs for SQL errors
2. Fix the migration file
3. Use `force` command to reset version if needed:
   ```bash
   migrate -path migrations -database "$DATABASE_URL" force {version}
   ```

### Migration Stuck

If a migration fails mid-execution:

1. Check current version:
   ```bash
   migrate -path migrations -database "$DATABASE_URL" version
   ```

2. Fix the migration file

3. Force to the previous version:
   ```bash
   migrate -path migrations -database "$DATABASE_URL" force {previous_version}
   ```

4. Re-run migrations:
   ```bash
   migrate -path migrations -database "$DATABASE_URL" up
   ```

### Database Connection Issues

Make sure the database is running:

```bash
docker ps | grep timescale
# Should show: docker-timescaledb-1 (healthy)
```

Check the connection string matches your setup:
```bash
echo $DATABASE_URL
# Should be: postgres://nous:nous@localhost:5432/nous?sslmode=disable
```

## Features

- ✅ Tracks applied migrations automatically
- ✅ Rollback support (down migrations)
- ✅ CLI tool for creating migrations
- ✅ Runs automatically on startup
- ✅ Better error handling
- ✅ Migration validation
- ✅ Transaction support (each migration runs in a transaction)
