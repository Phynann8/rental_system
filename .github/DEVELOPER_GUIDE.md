# Developer Quick Start - CI/CD

## For First-Time Contributors

### 1. Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/rental_system.git
cd rental_system

# Setup backend
cd RentalSystem.Web
dotnet restore
cd ..

# Setup frontend
cd rentalmgr---professional-property-management
npm install
cd ..
```

### 2. Before You Push

Always run tests locally:

```bash
# Terminal 1: Backend tests
cd RentalSystem.Tests
dotnet test
# ✓ All tests should pass

# Terminal 2: Frontend tests
cd rentalmgr---professional-property-management
npm test -- --run
# ✓ All tests should pass
```

### 3. Create Your Branch

```bash
git checkout -b feature/your-feature-name
# Branch names: feature/*, bugfix/*, docs/*, etc.
```

### 4. Make Changes

```bash
# Edit files as needed
# Commit with clear messages
git commit -m "Add user authentication for login"
```

### 5. Push to GitHub

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request (PR)

- Go to GitHub repository
- Click "New Pull Request"
- Select your branch
- Fill in description
- Click "Create Pull Request"

### 7. Automatic Checks Run

GitHub Actions automatically starts:
- Backend build and test
- Frontend build and test
- Results appear in PR within 1-2 minutes

### 8. Review PR Comments

Check the PR for:
- ✅ Green checkmarks = all checks passed
- ❌ Red X = something failed (click "Details" to see logs)

### 9. Request Review

- Click "Reviewers" → select team member
- Wait for review and approval

### 10. Merge

Once approved and all checks pass:
- Click "Merge pull request"
- PR closes and code is merged to `main`

---

## Troubleshooting

### "Build failed in CI but works locally"

**Likely causes:**
- Different Node/Dotnet versions
- Environment variables not set
- Files not committed to git

**Solution:**
```bash
# Ensure you committed all changes
git status  # Should show clean working directory
git add .
git commit -m "Fix changes"
git push origin feature/my-feature

# Check CI logs for specific error
# Click workflow link in PR → see the failed step
```

### "Tests pass locally but fail in CI"

**Common issues:**
1. Tests pass because you have data in local DB
2. Tests fail because CI uses clean in-memory DB

**Solution:**
```bash
# Run with clean state
dotnet clean
dotnet test

# Frontend
rm -rf node_modules package-lock.json
npm ci
npm test -- --run
```

### "PR says I need to update branch"

This means `main` has new commits you don't have.

**Solution:**
```bash
git fetch origin
git rebase origin/main
# If conflicts appear, resolve them
git push origin feature/my-feature --force-with-lease
```

### "I did `git push --force` and broke CI"

Don't use `git push --force` unless absolutely necessary.

**Use instead:**
```bash
git push --force-with-lease
```

This prevents overwriting others' work.

---

## Common Commands Quick Reference

```bash
# See current branch
git branch

# See uncommitted changes
git status

# Commit all changes
git add .
git commit -m "Your message here"

# Push to GitHub
git push origin feature-name

# Pull latest main
git pull origin main

# See recent commits
git log --oneline -5

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View diff before committing
git diff
```

---

## Test Coverage Quick Check

### Backend

```bash
cd RentalSystem.Tests
dotnet test --verbosity normal
```

Look for: `Test Run Successful` at end of output

### Frontend

```bash
cd rentalmgr---professional-property-management
npm test -- --run
```

Look for: `Test Files  X passed` at end of output

---

## What Happens on Each Workflow

### ✅ On Your Feature Branch
- Quality gates run automatically
- You see status in PR
- You can iterate and push fixes
- Workflow runs again automatically

### ✅ When Merged to Main
- Final quality gates run
- If test succeeds, main is safe
- Release preparation begins

### ✅ When Tag is Created (v1.0.0)
- Release workflow starts
- Artifacts are built
- GitHub Release is created

---

## Questions?

1. **Check the workflow logs** - Click failed step to see error details
2. **Check .github/WORKFLOWS.md** - Comprehensive workflow documentation
3. **Ask a teammate** - They may have solved it before
4. **Create an issue** - Document the problem for future reference

---

## Best Practices

✅ **DO:**
- Run tests locally before pushing
- Push early and often (don't hoard changes)
- Ask for review before merging
- Use clear commit messages
- Keep PRs focused on one feature

❌ **DON'T:**
- Push directly to main
- Bypass CI checks
- Force push unless necessary
- Ignore failing tests
- Commit secrets or credentials

---

## Your First PR Checklist

- [ ] All local tests pass
- [ ] Committed all changes
- [ ] Pushed to GitHub (not to main)
- [ ] Created Pull Request
- [ ] Quality gates show green checkmarks
- [ ] Requested review from team
- [ ] Responded to review comments
- [ ] Ready to merge when approved

---

**Welcome to the team! 🚀**
