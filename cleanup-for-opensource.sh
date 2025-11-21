#!/bin/bash
# cleanup-for-opensource.sh
# Prepares the project for open source publication

set -e  # Exit on error

echo "🧹 Cleaning up project for open source..."
echo ""

# Remove unnecessary files
echo "📦 Removing duplicate/unnecessary files..."
files_to_remove=(
    "bun.lockb"
    "Dockerfile.new"
    "Dockerfile.dev"
    "production.env.template"
    "setup-server.sh"
    "update.sh"
)

for file in "${files_to_remove[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo "  ✅ Removed: $file"
    else
        echo "  ℹ️  Not found (OK): $file"
    fi
done

echo ""
echo "🗑️  Removing build artifacts..."
rm -rf dist/
rm -rf backend/dist/
rm -rf backend/dev.db
rm -rf backend/dev.db-journal
echo "  ✅ Build artifacts removed"

echo ""
echo "🔍 Checking for sensitive files..."

# Verify .env is not tracked
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo "  ⚠️  WARNING: .env is tracked by git!"
    echo "  Run: git rm --cached .env"
    exit 1
else
    echo "  ✅ .env is not tracked"
fi

# Verify backend .env is not tracked
if git ls-files --error-unmatch backend/.env 2>/dev/null; then
    echo "  ⚠️  WARNING: backend/.env is tracked by git!"
    echo "  Run: git rm --cached backend/.env"
    exit 1
else
    echo "  ✅ backend/.env is not tracked"
fi

echo ""
echo "📝 Updating .gitignore..."

# Required patterns in .gitignore
required_ignores=(
    ".env"
    ".env.local"
    ".env.*.local"
    "*.env"
    "node_modules"
    "dist"
    "dist-ssr"
    ".DS_Store"
    "*.log"
    "*.db"
    "*.db-journal"
    ".claude/"
    "coverage/"
    "logs/"
)

gitignore_updated=false
for pattern in "${required_ignores[@]}"; do
    if ! grep -q "^${pattern}$" .gitignore 2>/dev/null; then
        echo "$pattern" >> .gitignore
        echo "  ➕ Added to .gitignore: $pattern"
        gitignore_updated=true
    fi
done

if [ "$gitignore_updated" = false ]; then
    echo "  ✅ .gitignore is up to date"
fi

echo ""
echo "🔐 Security scan..."

# Check for potential secrets in tracked files
echo "  🔍 Scanning for potential secrets..."
secret_patterns=("password" "secret" "api.key" "token")
found_issues=false

for pattern in "${secret_patterns[@]}"; do
    if git grep -i "$pattern" -- '*.ts' '*.js' '*.tsx' '*.json' 2>/dev/null | grep -v -E '(\.example|\.md|passwordUtils|password:)' | head -1 > /dev/null; then
        echo "  ⚠️  Found potential secret pattern: $pattern"
        found_issues=true
    fi
done

if [ "$found_issues" = true ]; then
    echo ""
    echo "  ⚠️  Please review the matches above"
    echo "  Run: git grep -i 'password\\|secret\\|api.key\\|token' -- '*.ts' '*.js' '*.tsx' '*.json'"
else
    echo "  ✅ No obvious secrets found in tracked files"
fi

echo ""
echo "✨ Cleanup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Review changes:"
echo "   git status"
echo ""
echo "2️⃣  Test the build:"
echo "   npm install"
echo "   npm run build"
echo "   docker-compose up --build"
echo ""
echo "3️⃣  Update metadata in package.json:"
echo "   - author"
echo "   - repository URL"
echo "   - homepage"
echo ""
echo "4️⃣  Update README.md:"
echo "   - Add your repository URL"
echo "   - Add badges"
echo "   - Review setup instructions"
echo ""
echo "5️⃣  Commit cleanup changes:"
echo "   git add ."
echo "   git commit -m 'chore: prepare for open source release'"
echo ""
echo "6️⃣  Create GitHub repository and push:"
echo "   git remote add origin <your-repo-url>"
echo "   git push -u origin main"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📄 See OPEN-SOURCE-READINESS.md for detailed checklist"
echo ""
