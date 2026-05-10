# Branch Protection Rules

To enforce quality gates and prevent bypassing CI checks, configure GitHub branch protection rules.

## Setup Instructions

1. **Go to GitHub Repository Settings**
   - Repository → Settings → Branches → Branch protection rules

2. **Create Rule for `main` Branch**
   - Click "Add rule"
   - Pattern: `main`

3. **Configure Protection Settings**

### Require a pull request before merging ✅

- [x] Require pull request reviews before merging
  - Required number of approvals: **1**
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from code owners (if CODEOWNERS file exists)

- [x] Require approval of the most recent reviewable push
- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging

### Status checks required

All of these must pass:
- `Backend Quality Check` (from quality-gates workflow)
- `Frontend Quality Check` (from quality-gates workflow)
- `quality-gate-result` (overall status)

### Other Protection Settings

- [x] Require code reviews before merging
- [x] Require status checks to pass
- [x] Require branches to be up to date before merging
- [x] Require conversation resolution before merging
- [x] Require signed commits (recommended)
- [x] Restrict who can push to matching branches
  - Allow only administrators to push

### Additional Restrictions

- [x] Allow force pushes
  - Specify who can force push: **Administrators**
  
- [x] Allow deletions
  - Set to: **Disabled** (prevent accidental deletion)

---

## Expected Branch Protection Configuration

```
Branch: main
├── Pull Request Reviews
│   ├── Min approvals: 1
│   ├── Dismiss stale reviews: ✓
│   └── Code owners review: ✓
├── Status Checks (Required)
│   ├── Backend Quality Check ✓
│   ├── Frontend Quality Check ✓
│   └── quality-gate-result ✓
├── Signed Commits: ✓
├── Force Push: Admins only
├── Deletions: Disabled
└── Enforce for Administrators: ✓
```

---

## Develop Branch Protection

For `develop` branch, use less strict rules:

1. Pattern: `develop`
2. Require 1 pull request review
3. Require status checks (quality-gates)
4. Dismiss stale reviews

---

## Enforcing Quality Gates

### What the Branch Protection Does

✅ **Blocks merge if:**
- Quality gates workflow has not completed
- Any required status check has failed
- Backend build or tests fail
- Frontend build or tests fail
- PR has not been reviewed
- Branch is not up to date with main

❌ **Allows merge only if:**
- All status checks pass
- At least 1 approval received
- Branch is up to date
- No conflicting changes

---

## Viewing Check Status

### In Pull Request

- All status checks displayed at bottom of PR
- Click "Details" to view specific workflow logs
- Checks must show green checkmark before merge button enables

### In GitHub Actions Tab

- View full workflow run logs
- See which step failed and why
- Access test reports and artifacts

---

## Bypassing Rules (Admin Only)

Administrators can override checks in emergency situations:

- Repository Settings → Branches → Branch protection rules
- Temporarily disable rule and re-enable after fix
- Always prefer fixing the issue to bypassing gates

---

## Code Owners (Optional)

Create `.github/CODEOWNERS` file to require approvals from specific team members:

```
# Backend files require backend team approval
RentalSystem.Web/          @backend-team
RentalSystem.Tests/        @backend-team

# Frontend files require frontend team approval
rentalmgr---**/            @frontend-team

# CI workflows require devops approval
.github/workflows/         @devops-team

# Documentation maintainers
README.md                  @maintainers
TESTING.md                 @maintainers
```

---

## GitHub CLI Setup (Automated)

Optionally use GitHub CLI to configure rules:

```bash
# Requires GitHub CLI installed and authenticated

# Get repository information
gh repo view --json owner,name

# Create branch protection rule
gh api repos/{owner}/{repo}/branches/main/protection \
  -f required_status_checks='{"strict":true,"contexts":["Backend Quality Check","Frontend Quality Check","quality-gate-result"]}' \
  -f required_pull_request_reviews='{"dismissal_restrictions":{},"require_code_owner_reviews":false,"required_approving_review_count":1}' \
  -f enforce_admins=true \
  -f allow_force_pushes=false \
  -f allow_deletions=false \
  -f require_linear_history=false \
  -f require_conversation_resolution=true \
  -f require_signed_commits=false \
  -f restrictions=null
```

---

## Status Checks Reference

### Backend Quality Check
- **Workflow:** quality-gates.yml
- **Purpose:** Backend build + test
- **Required:** YES
- **Failures:** 
  - Build errors
  - Test failures
  - Restore errors

### Frontend Quality Check
- **Workflow:** quality-gates.yml
- **Purpose:** Frontend type check + build + test
- **Required:** YES
- **Failures:**
  - Type errors
  - Build errors
  - Test failures
  - Lint errors

### quality-gate-result
- **Workflow:** quality-gates.yml
- **Purpose:** Overall status aggregation
- **Required:** YES
- **Fails if:** Any check fails

---

## Troubleshooting

### "Required status checks are expected to fail"

This occurs when:
1. Status check name doesn't exactly match workflow job name
2. Workflow hasn't run yet on the branch
3. Workflow file has syntax errors

**Solution:**
1. Verify exact check names in settings match workflow outputs
2. Push a commit to trigger workflow
3. Check Actions tab for workflow errors

### "Cannot merge pull request with failing checks"

This is the expected behavior - checks must pass.

**To fix:**
1. Review workflow logs in Actions tab
2. Fix any errors locally
3. Push fix to PR branch
4. Workflow re-runs automatically

### "Waiting for status checks..."

Check hasn't reported yet.

**Solutions:**
1. Wait a few seconds - workflow may be starting
2. Check Actions tab if workflow failed to start
3. Check if branch filter matches (paths, branches)

---

## PR Workflow with Protections

```
1. Create feature branch
   git checkout -b feature/my-feature

2. Make changes and commit
   git commit -m "Add feature"

3. Push to GitHub
   git push origin feature/my-feature

4. Create Pull Request
   - Select main as target
   - Add description
   - Submit PR

5. Automatic Checks Run
   - GitHub Actions starts quality-gates workflow
   - Backend and frontend checks run in parallel
   - Test results appear in PR

6. Code Review
   - Team reviews changes
   - Provides approval or requests changes
   - Loop until approved

7. Update Main Protection
   - Ensure branch is up to date
   - Resolve any merge conflicts
   - All checks must pass

8. Merge
   - Click "Squash and merge" or "Create merge commit"
   - PR closes
   - Workflow triggers on main

9. Release (Optional)
   - Tag commit with version (v1.0.0)
   - Release workflow publishes artifacts
```

---

## Recommended Settings Summary

| Setting | Value | Reason |
|---------|-------|--------|
| Pull request reviews required | 1 | Catch issues during review |
| Dismiss stale reviews | ✓ | Ensure latest code is reviewed |
| Status checks required | ✓ | Prevent broken code merges |
| Code owners review | ✓ | Domain expertise in reviews |
| Branches up to date | ✓ | Avoid merge conflicts |
| Require signed commits | ✓ | Verify code authenticity |
| Allow force pushes | ✗ | Prevent history rewriting |
| Allow deletions | ✗ | Prevent accidental loss |
| Enforce for admins | ✓ | No bypass for anyone |

---

## Next Steps

1. Create branch protection rules as described above
2. Test by creating a PR with intentionally failing test
3. Verify PR cannot be merged until fixed
4. Document team's code review process
5. Monitor PR metrics and iteration time

---

**Last Updated:** April 3, 2026
