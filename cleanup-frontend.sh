#!/bin/bash

################################################################################
# Riksdag-Regering.AI Frontend Cleanup Script
#
# Purpose: Remove React frontend components while preserving MCP server
# Author: Claude Code
# Date: 2025-11-19
#
# Usage:
#   ./cleanup-frontend.sh           # Interactive mode with dry-run preview
#   ./cleanup-frontend.sh --dry-run # Preview only, no changes
#   ./cleanup-frontend.sh --yes     # Skip confirmation, delete immediately
################################################################################

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_LIST_FILE="$SCRIPT_DIR/cleanup-backup-list-$(date +%Y%m%d_%H%M%S).txt"
DRY_RUN=false
SKIP_CONFIRMATION=false
KEEP_MIGRATIONS=false

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_delete() {
    echo -e "${RED}🗑${NC}  $1"
}

print_preserve() {
    echo -e "${GREEN}💾${NC} $1"
}

################################################################################
# Safety Checks
################################################################################

verify_directory() {
    print_header "Verifying Directory"

    # Check if we're in the right directory
    if [[ ! -d "$SCRIPT_DIR/mcp" ]]; then
        print_error "MCP folder not found! Are you in the correct directory?"
        print_info "Expected: Riksdag-Regering.AI repository root"
        print_info "Current: $SCRIPT_DIR"
        exit 1
    fi

    print_success "Located MCP server directory: $SCRIPT_DIR/mcp"

    # Check if critical MCP files exist
    if [[ ! -f "$SCRIPT_DIR/mcp/package.json" ]]; then
        print_warning "mcp/package.json not found - MCP server may be incomplete"
    else
        print_success "MCP server package.json verified"
    fi

    # Check if we're in a git repo
    if [[ -d "$SCRIPT_DIR/.git" ]]; then
        print_success "Git repository detected"

        # Check for uncommitted changes
        if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
            print_warning "You have uncommitted changes in your repository"
            print_info "Consider committing or stashing changes before cleanup"

            if [[ "$SKIP_CONFIRMATION" != "true" ]]; then
                read -p "Continue anyway? (y/N): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    print_info "Cleanup cancelled"
                    exit 0
                fi
            fi
        fi
    fi
}

################################################################################
# File/Folder Lists
################################################################################

# Files and folders to DELETE
FILES_TO_DELETE=(
    # Frontend source
    "src"
    "public"

    # Supabase functions (frontend-related)
    "supabase/functions"

    # Documentation (frontend-specific)
    "docs"

    # Build scripts
    "scripts"

    # Frontend config files
    "vite.config.ts"
    "vitest.config.ts"
    "tailwind.config.ts"
    "postcss.config.js"
    "components.json"
    "tsconfig.app.json"
    "eslint.config.js"

    # Deployment configs
    "hostinger.config.json"
    "deploy-config.json"
    "build.sh"

    # HTML files
    "index.html"
    "404.html"

    # Static assets
    "robots.txt"
    "placeholder.svg"
    "favicon.ico"

    # Disabled workflows
    ".github/workflows/ci.yml.disabled"
    ".github/workflows/deploy-api.yml.disabled"
    ".github/workflows/deploy-frontend.yml.disabled"
    ".github/workflows/deploy.yml.disabled"
    ".github/workflows/hostinger.yml.disabled"
    ".github/workflows/update-data.yml.disabled"

    # Guide files
    "CHATGPT_GUIDE.md"
    "REMOTE_MCP_GUIDE.md"
)

# Optional: Supabase migrations (ask user)
OPTIONAL_DELETE=(
    "supabase/migrations"
)

# Files and folders to PRESERVE
FILES_TO_PRESERVE=(
    "mcp"
    "README.md"
    "SECURITY.md"
    ".gitignore"
    ".github/workflows/mcp-server-ci.yml"
    "package.json"
    "tsconfig.json"
    "LICENSE"
    ".env"
    ".env.example"
)

################################################################################
# Preview Function
################################################################################

preview_changes() {
    print_header "Preview: Files to Delete"

    local total_size=0
    local file_count=0

    for item in "${FILES_TO_DELETE[@]}"; do
        local full_path="$SCRIPT_DIR/$item"

        if [[ -e "$full_path" ]]; then
            # Calculate size
            if [[ -d "$full_path" ]]; then
                local size=$(du -sh "$full_path" 2>/dev/null | cut -f1)
                print_delete "$item/ (folder, $size)"
            else
                local size=$(du -h "$full_path" 2>/dev/null | cut -f1)
                print_delete "$item (file, $size)"
            fi
            ((file_count++))
        fi
    done

    # Check optional migrations
    if [[ -d "$SCRIPT_DIR/supabase/migrations" ]]; then
        local size=$(du -sh "$SCRIPT_DIR/supabase/migrations" 2>/dev/null | cut -f1)
        print_warning "supabase/migrations/ (optional, $size) - will ask"
    fi

    echo ""
    print_info "Total items to delete: $file_count"

    print_header "Preview: Files to Preserve"

    for item in "${FILES_TO_PRESERVE[@]}"; do
        local full_path="$SCRIPT_DIR/$item"

        if [[ -e "$full_path" ]]; then
            if [[ -d "$full_path" ]]; then
                print_preserve "$item/ (folder)"
            else
                print_preserve "$item (file)"
            fi
        fi
    done
}

################################################################################
# Deletion Function
################################################################################

perform_deletion() {
    print_header "Performing Cleanup"

    # Ask about migrations
    if [[ -d "$SCRIPT_DIR/supabase/migrations" ]] && [[ "$SKIP_CONFIRMATION" != "true" ]]; then
        echo ""
        print_warning "Found supabase/migrations/ folder"
        print_info "This may contain database schema that could be useful later"
        read -p "Delete migrations folder? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            KEEP_MIGRATIONS=false
        else
            KEEP_MIGRATIONS=true
            print_success "Keeping migrations folder"
        fi
    fi

    # Create backup list
    {
        echo "Riksdag-Regering.AI Cleanup Report"
        echo "Date: $(date)"
        echo "Directory: $SCRIPT_DIR"
        echo ""
        echo "Deleted Files/Folders:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    } > "$BACKUP_LIST_FILE"

    # Delete files
    local deleted_count=0

    for item in "${FILES_TO_DELETE[@]}"; do
        local full_path="$SCRIPT_DIR/$item"

        if [[ -e "$full_path" ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                print_info "[DRY RUN] Would delete: $item"
            else
                # Record in backup list
                echo "$item" >> "$BACKUP_LIST_FILE"

                # Delete
                if rm -rf "$full_path"; then
                    print_success "Deleted: $item"
                    ((deleted_count++))
                else
                    print_error "Failed to delete: $item"
                fi
            fi
        fi
    done

    # Handle migrations
    if [[ "$KEEP_MIGRATIONS" == "false" ]] && [[ -d "$SCRIPT_DIR/supabase/migrations" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            print_info "[DRY RUN] Would delete: supabase/migrations"
        else
            echo "supabase/migrations" >> "$BACKUP_LIST_FILE"
            if rm -rf "$SCRIPT_DIR/supabase/migrations"; then
                print_success "Deleted: supabase/migrations"
                ((deleted_count++))
            else
                print_error "Failed to delete: supabase/migrations"
            fi
        fi
    fi

    # Clean up empty supabase folder
    if [[ -d "$SCRIPT_DIR/supabase" ]] && [[ -z "$(ls -A "$SCRIPT_DIR/supabase")" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            print_info "[DRY RUN] Would delete empty folder: supabase"
        else
            rmdir "$SCRIPT_DIR/supabase"
            print_success "Deleted empty folder: supabase"
        fi
    fi

    echo ""

    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "DRY RUN COMPLETE - No files were deleted"
        rm -f "$BACKUP_LIST_FILE"
    else
        print_success "Cleanup complete! Deleted $deleted_count items"
        print_info "Backup list saved: $BACKUP_LIST_FILE"
    fi
}

################################################################################
# Verification Function
################################################################################

verify_mcp_server() {
    print_header "Verifying MCP Server"

    # Check MCP directory exists
    if [[ ! -d "$SCRIPT_DIR/mcp" ]]; then
        print_error "MCP folder is missing! Critical error!"
        exit 1
    fi

    print_success "MCP folder intact"

    # Check package.json
    if [[ -f "$SCRIPT_DIR/mcp/package.json" ]]; then
        print_success "mcp/package.json exists"

        # Try to parse it
        if command -v jq &> /dev/null; then
            local mcp_name=$(jq -r '.name' "$SCRIPT_DIR/mcp/package.json" 2>/dev/null)
            if [[ -n "$mcp_name" ]]; then
                print_success "MCP package name: $mcp_name"
            fi
        fi
    else
        print_warning "mcp/package.json not found"
    fi

    # Check index.ts
    if [[ -f "$SCRIPT_DIR/mcp/src/index.ts" ]]; then
        print_success "mcp/src/index.ts exists"
    else
        print_warning "mcp/src/index.ts not found"
    fi

    # Check node_modules
    if [[ -d "$SCRIPT_DIR/mcp/node_modules" ]]; then
        print_success "mcp/node_modules exists (dependencies installed)"
    else
        print_warning "mcp/node_modules not found - you may need to run: cd mcp && npm install"
    fi

    echo ""
    print_info "MCP server structure verified"
}

################################################################################
# Main Execution
################################################################################

main() {
    # Parse arguments
    for arg in "$@"; do
        case $arg in
            --dry-run)
                DRY_RUN=true
                ;;
            --yes|-y)
                SKIP_CONFIRMATION=true
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --dry-run    Preview changes without deleting"
                echo "  --yes, -y    Skip confirmation prompts"
                echo "  --help, -h   Show this help message"
                echo ""
                echo "Description:"
                echo "  Removes React frontend components while preserving MCP server"
                echo "  Creates backup list of deleted files"
                echo "  Verifies MCP server integrity after cleanup"
                exit 0
                ;;
            *)
                print_error "Unknown option: $arg"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Print banner
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  Riksdag-Regering.AI Frontend Cleanup Script              ║"
    echo "║  Removes frontend, preserves MCP server                    ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    if [[ "$DRY_RUN" == "true" ]]; then
        print_warning "DRY RUN MODE - No files will be deleted"
    fi

    # Safety checks
    verify_directory

    # Preview changes
    preview_changes

    # Confirmation (unless --yes or --dry-run)
    if [[ "$SKIP_CONFIRMATION" != "true" ]] && [[ "$DRY_RUN" != "true" ]]; then
        echo ""
        print_warning "This will permanently delete the files listed above"
        print_info "A backup list will be created at: $BACKUP_LIST_FILE"
        echo ""
        read -p "Proceed with cleanup? (y/N): " -n 1 -r
        echo

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Cleanup cancelled"
            exit 0
        fi
    fi

    # Perform deletion
    perform_deletion

    # Verify MCP server
    if [[ "$DRY_RUN" != "true" ]]; then
        echo ""
        verify_mcp_server
    fi

    # Final summary
    print_header "Cleanup Summary"

    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "Dry run complete - no changes made"
        print_info "Run without --dry-run to perform actual cleanup"
    else
        print_success "Frontend cleanup successful!"
        print_success "MCP server preserved and verified"
        print_info "Backup list: $BACKUP_LIST_FILE"

        echo ""
        print_info "Next steps:"
        echo "  1. Review preserved files"
        echo "  2. Update README.md for MCP-only documentation"
        echo "  3. Clean up package.json dependencies"
        echo "  4. Test MCP server: cd mcp && npm test"
        echo "  5. Commit changes: git add -A && git commit -m 'Remove frontend, keep MCP server only'"
    fi

    echo ""
}

# Execute main function
main "$@"
