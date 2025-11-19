# Frontend Cleanup Instructions

## Overview

This guide helps you safely remove the React frontend from the Riksdag-Regering.AI repository while preserving the MCP server.

## Quick Start

```bash
# 1. Preview what will be deleted (safe, no changes)
./cleanup-frontend.sh --dry-run

# 2. Run the cleanup (interactive, asks for confirmation)
./cleanup-frontend.sh

# 3. Or skip all prompts
./cleanup-frontend.sh --yes
```

## What Gets Deleted

### Folders
- `src/` - React frontend source code
- `public/` - Static assets
- `supabase/functions/` - Edge functions (frontend-related)
- `supabase/migrations/` - **Optional** (script will ask)
- `docs/` - Frontend documentation
- `scripts/` - Build/deployment scripts

### Config Files
- `vite.config.ts` - Vite bundler config
- `vitest.config.ts` - Test config
- `tailwind.config.ts` - CSS framework
- `postcss.config.js` - CSS processing
- `components.json` - shadcn/ui config
- `tsconfig.app.json` - TypeScript app config
- `eslint.config.js` - Linting config
- `hostinger.config.json` - Hosting config
- `deploy-config.json` - Deployment config
- `build.sh` - Build script

### HTML/Assets
- `index.html`
- `404.html`
- `robots.txt`
- `placeholder.svg`
- `favicon.ico`

### Disabled Workflows
- `.github/workflows/*.disabled`

### Docs
- `CHATGPT_GUIDE.md`
- `REMOTE_MCP_GUIDE.md`

## What Gets Preserved

### Critical
- `mcp/` - **Entire MCP server** (this is the point!)
- `.github/workflows/mcp-server-ci.yml` - MCP CI/CD

### Configuration
- `package.json` - Root package (needs cleanup later)
- `tsconfig.json` - TypeScript config
- `.gitignore`
- `.env` and `.env.example`

### Documentation
- `README.md` (needs updating for MCP-only)
- `SECURITY.md`
- `LICENSE`

## Step-by-Step Process

### 1. Safety Checks

The script automatically:
- ✓ Verifies you're in the correct directory
- ✓ Checks that `mcp/` folder exists
- ✓ Warns about uncommitted git changes
- ✓ Shows what will be deleted before proceeding

### 2. Preview Mode

**Always run preview first:**

```bash
./cleanup-frontend.sh --dry-run
```

This shows:
- Files that will be deleted (with sizes)
- Files that will be preserved
- Total number of items

**No files are modified in dry-run mode.**

### 3. Interactive Cleanup

```bash
./cleanup-frontend.sh
```

The script will:
1. Verify directory structure
2. Show preview of changes
3. **Ask for confirmation** before deleting
4. Ask if you want to keep `supabase/migrations/`
5. Delete files
6. Verify MCP server integrity
7. Create backup list of deleted files

### 4. Automated Cleanup

```bash
./cleanup-frontend.sh --yes
```

Skips all confirmation prompts. Use only if you're **absolutely sure**.

## Post-Cleanup Steps

After running the script, you should:

### 1. Review Preserved Files

Check that critical files are intact:

```bash
ls -la mcp/
cat README.md
```

### 2. Update README.md

Replace frontend documentation with MCP-only instructions:

```markdown
# Riksdag-Regering.AI MCP Server

A Model Context Protocol server for accessing Swedish parliamentary data.

## Installation

\`\`\`bash
cd mcp
npm install
\`\`\`

## Usage

See [MCP Documentation](./mcp/README.md)
```

### 3. Clean package.json

The root `package.json` still contains frontend dependencies. You should:

```bash
# Remove frontend-specific dependencies
# Keep only build/dev tools if needed
```

**Example cleaned package.json:**

```json
{
  "name": "riksdag-regering-ai",
  "version": "1.0.0",
  "description": "MCP Server for Swedish Parliamentary Data",
  "private": true,
  "workspaces": ["mcp"],
  "scripts": {
    "test": "cd mcp && npm test",
    "build": "cd mcp && npm run build"
  }
}
```

### 4. Test MCP Server

```bash
cd mcp
npm install
npm test
npm run build
```

### 5. Commit Changes

```bash
# Review changes
git status

# Stage all deletions and modifications
git add -A

# Commit with clear message
git commit -m "Remove React frontend, keep MCP server only

- Deleted src/, public/, supabase/functions/
- Deleted frontend config files (vite, tailwind, etc.)
- Preserved mcp/ directory and MCP CI workflow
- Kept README.md, SECURITY.md, LICENSE
- Next: Update docs for MCP-only setup"

# Push to repository
git push
```

## Backup

The script automatically creates a backup list:

```
cleanup-backup-list-YYYYMMDD_HHMMSS.txt
```

This file contains:
- Date/time of cleanup
- Directory where cleanup was run
- List of all deleted files/folders

**Keep this file** in case you need to reference what was deleted.

## Troubleshooting

### "MCP folder not found!"

You're not in the correct directory. Navigate to the repository root:

```bash
cd /Users/isak/Riksdag-Regering.AI
./cleanup-frontend.sh
```

### "Failed to delete: [file]"

Check file permissions:

```bash
ls -la [file]
chmod +w [file]
./cleanup-frontend.sh
```

### MCP Server Broken After Cleanup

The script verifies MCP integrity, but if something went wrong:

1. Check backup list: `cleanup-backup-list-*.txt`
2. Restore from git: `git checkout HEAD -- [file]`
3. Verify MCP structure:

```bash
ls -la mcp/
cat mcp/package.json
```

### Want to Undo Cleanup

Before commit:

```bash
git restore .
git clean -fd
```

After commit:

```bash
git revert HEAD
```

## Command Reference

```bash
# Preview (safe, no changes)
./cleanup-frontend.sh --dry-run

# Interactive (asks for confirmation)
./cleanup-frontend.sh

# Automated (no prompts)
./cleanup-frontend.sh --yes

# Show help
./cleanup-frontend.sh --help
```

## Safety Features

The script includes:

1. **Directory verification** - Ensures you're in the right place
2. **Dry-run mode** - Preview before execution
3. **Confirmation prompts** - For destructive actions
4. **Backup list creation** - Record of deleted files
5. **MCP verification** - Checks server integrity after cleanup
6. **Git status check** - Warns about uncommitted changes
7. **Colored output** - Red = delete, Green = preserve
8. **Size reporting** - Shows space to be freed

## Notes

- **The script does NOT commit changes** - You must do this manually
- **The script does NOT modify git history** - Files are deleted from working directory only
- **Migrations folder is optional** - Script will ask before deleting
- **No files are permanently lost** - Use git to restore if needed (before commit)
- **Root package.json is preserved** - You should clean it manually

## Need Help?

1. Run with `--help`: `./cleanup-frontend.sh --help`
2. Check backup list after cleanup
3. Use `git status` to review changes
4. Test MCP server before committing
5. Keep backup list file for reference

---

**Created:** 2025-11-19
**Script Version:** 1.0
**Author:** Claude Code
