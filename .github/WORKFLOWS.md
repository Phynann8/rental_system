# CI/CD Pipeline Documentation

## Overview

The Rental System uses GitHub Actions to enforce quality gates and automate build, test, and release processes. All changes must pass comprehensive checks before being merged to main or deployed.

## Workflows

### 1. Quality Gates (`quality-gates.yml`)

**Trigger:** Push to main/develop, Pull Requests

**Purpose:** Main validation workflow that ensures all code meets quality standards before merge.

**Jobs:**
- `backend-check`: Builds backend and runs all unit tests
- `frontend-check`: Type checks, builds frontend, and runs tests
- `quality-gate-result`: Aggregates results and fails if any check fails
- `notify-status`: Posts PR comments with results

**Status:** Required for PR approval

```
Push to main/develop or create PR
  ↓
Backend Check (build + test)
Frontend Check (type check + build + test)
  ↓
Quality Gate Result
  ↓
Notify via PR Comment
```

---

### 2. Backend Workflow (`backend.yml`)

**Trigger:** Changes to `RentalSystem.Web/**`, `RentalSystem.Tests/**`, or workflow file

**Purpose:** Dedicated backend build and test pipeline with extended checks.

**Jobs:**
- `build-and-test`: 
  - Restores dependencies
  - Builds solution in Release mode
  - Runs all unit tests with TRX reporting
  - Uploads test results as artifacts
- `code-quality`:
  - Checks code formatting
  - Runs style analysis

**Matrix:** Builds against .NET 10.0.x

**Artifacts:**
- Backend test results (TRX format)
- Test reports via dorny/test-reporter

---

### 3. Frontend Workflow (`frontend.yml`)

**Trigger:** Changes to `rentalmgr---professional-property-management/**` or workflow file

**Purpose:** Frontend build, lint, and test pipeline.

**Jobs:**
- `build-lint-test`:
  - Installs dependencies
  - TypeScript type checking
  - Builds Vite application
  - Runs linting (if configured)
  - Runs test suite with Vitest
  - Generates coverage report
  - Uploads coverage artifacts
- `build-result`: Aggregates results

**Matrix:** Node.js 18.x and 20.x (ensures compatibility)

**Artifacts:**
- Frontend coverage reports
- Build outputs

---

### 4. Release & Publish (`release.yml`)

**Trigger:** Push to main branch, or push of version tags (v*)

**Purpose:** Automated release and artifact publishing.

**Jobs:**
- `pre-release-check`: Final quality gate before release
- `frontend-pre-release`: Frontend final checks
- `build-artifacts`: Creates optimized production builds
- `create-release`: Publishes GitHub release with artifacts

**Output:**
- GitHub Release with version tag
- Backend compiled binaries
- Frontend optimized bundle
- Release notes

---

## Quality Gates

All quality gates must pass before code can be merged:

### Backend Checks ✅
- [ ] Restores NuGet packages successfully
- [ ] Builds without errors (Release configuration)
- [ ] All unit tests pass
- [ ] Code follows formatting standards

### Frontend Checks ✅
- [ ] npm dependencies install (no vulnerabilities)
- [ ] TypeScript compilation succeeds (no type errors)
- [ ] Vite build completes without errors
- [ ] All Vitest tests pass
- [ ] (Optional) ESLint linting passes
- [ ] Code coverage meets thresholds

## Status Badges

Add these to your README.md for visibility:

```markdown
![Backend Build](https://github.com/YOUR_USERNAME/rental_system/actions/workflows/backend.yml/badge.svg)
![Frontend Build](https://github.com/YOUR_USERNAME/rental_system/actions/workflows/frontend.yml/badge.svg)
![Quality Gates](https://github.com/YOUR_USERNAME/rental_system/actions/workflows/quality-gates.yml/badge.svg)
```

## Workflow Behavior

### On Pull Request
1. Quality gates workflow runs automatically
2. Both backend and frontend checks execute in parallel
3. Test results published to PR
4. PR comment shows overall status
5. PR cannot be merged until all checks pass

### On Push to Main
1. Quality gates run to validate code
2. If tag is version format (v*), release workflow triggers
3. Pre-release checks ensure code quality
4. Artifacts built for both backend and frontend
5. GitHub Release created with artifacts

### On Push to Develop
1. Quality gates run
2. Code is validated but not released
3. Developers get feedback on build status

## Local Testing

Run quality checks locally before pushing:

### Backend
```bash
cd RentalSystem.Web
dotnet build --configuration Release
dotnet test

# Check formatting
dotnet format --verify-no-changes
```

### Frontend
```bash
cd rentalmgr---professional-property-management
npm ci
npx tsc --noEmit
npm run build
npm test -- --run
```

## Configuration

### Adjusting Triggers

Edit the `on` section in any workflow file:

```yaml
on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'RentalSystem.Web/**'  # Only on backend changes
  pull_request:
    branches:
      - main
```

### Changing Node.js/Dotnet Versions

Edit the `strategy.matrix`:

```yaml
strategy:
  matrix:
    dotnet-version: ['10.0.x', '10.1.x']  # Test multiple versions
    node-version: ['18.x', '20.x']
```

### Modifying Build Commands

Update steps in workflows:

```yaml
- name: Build application
  run: npm run build  # Change to your build script
```

## Troubleshooting

### Backend Tests Fail in CI

**Check:**
1. Tests work locally: `dotnet test`
2. All dependencies restored: `dotnet restore`
3. No environment-specific code

**Solution:**
```bash
dotnet clean
dotnet restore
dotnet test --verbosity normal
```

### Frontend Tests Timeout

**Check:**
1. Test suite completes locally
2. `package-lock.json` is committed for reproducible installs

**Solution:**
```bash
npm ci  # Use exact versions
npm test -- --run  # Run without watch
```

### Workflow Not Triggering

**Check:**
1. Branch name matches workflow trigger
2. File path matches workflow `paths` filter
3. Workflow file is syntactically valid

**Solution:**
- Commit workflow changes to `main` first
- Check Actions tab for syntax errors
- Verify branch protection rules

### PR Status Check Failing

**Check:**
1. All required status checks are passing
2. Branch is up to date with main
3. No merge conflicts

**Solution:**
```bash
git fetch origin
git rebase origin/main
# Resolve conflicts
git push --force-with-lease
```

## Best Practices

### For Developers

1. **Run local checks before pushing:**
   ```bash
   # Backend
   dotnet test
   dotnet build --configuration Release
   
   # Frontend
   npm test -- --run
   npm run build
   ```

2. **Keep workflows simple** - Complex logic belongs in test files

3. **Use consistent formatting** - Run `dotnet format` and follow project conventions

4. **Test on target frameworks** - Workflows test against multiple Node/Dotnet versions

### For Maintainers

1. **Review workflow logs** for failures: GitHub Actions → Workflow → Run
2. **Keep secrets secure** - Never commit tokens or credentials
3. **Monitor execution time** - Workflows should complete in < 10 minutes
4. **Document changes** - Update this file when modifying workflows

## Scheduled Maintenance

Future improvements:

- [ ] Add dependency vulnerability scanning
- [ ] Add code coverage enforcement
- [ ] Add performance benchmarking
- [ ] Add security scanning
- [ ] Add database migration testing
- [ ] Add deployment to staging environment
- [ ] Add E2E testing (Cypress/Playwright)

## Support

For workflow issues:

1. Check the Actions tab in GitHub
2. Review specific job logs
3. Compare with local test results
4. Check syntax with `@ actions/github-script@v7` validator

---

**Last Updated:** April 3, 2026  
**Workflow Version:** 1.0
