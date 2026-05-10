# GitHub Directory - CI/CD & Documentation Index

Quick navigation for all GitHub-related configuration and documentation.

## 🚀 Quick Start

New to the project? Start here:
1. Read [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - 5 minute quick start
2. See [CI_CD_SETUP.md](CI_CD_SETUP.md) - What was set up and why
3. Run tests locally before pushing (see DEVELOPER_GUIDE)

## 📋 Complete File Index

### Workflow Automation (`.github/workflows/`)

| File | Purpose | Trigger |
|------|---------|---------|
| `backend.yml` | Build .NET backend + run tests | Push/PR with backend changes |
| `frontend.yml` | Build React frontend + run tests | Push/PR with frontend changes |
| `quality-gates.yml` | **Main validation gate** (required for merge) | All PRs and pushes |
| `release.yml` | Automated release and artifact build | Push to main or version tags |

**Key Workflow:** All PRs must pass `quality-gates.yml` to merge ✅

### Documentation

| File | Purpose | For Whom |
|------|---------|----------|
| [CI_CD_SETUP.md](CI_CD_SETUP.md) | Complete setup overview + next steps | Everyone - start here |
| [WORKFLOWS.md](WORKFLOWS.md) | Detailed workflow documentation | Developers, maintainers |
| [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md) | How to configure branch protection | Repository admin |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Quick start for contributors | New developers, contributors |

### QA & Testing

| File (in root) | Purpose |
|---|---|
| `TESTING.md` | Comprehensive test suite documentation |
| `README.md` | Project overview with CI badges |

## 🔧 Common Tasks

### "I'm pushing code, what should I do?"

1. Read [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - 5 minutes
2. Run tests locally:
   ```bash
   cd RentalSystem.Tests && dotnet test
   cd rentalmgr---professional-property-management && npm test -- --run
   ```
3. Push your feature branch and create a PR
4. Watch the quality gates run automatically

### "I'm setting up CI/CD, where do I start?"

1. Read [CI_CD_SETUP.md](CI_CD_SETUP.md) - Overview of what was set up
2. Review [WORKFLOWS.md](WORKFLOWS.md) - Understand each workflow
3. Follow [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md) - Set up branch rules
4. Test it with a simple PR

### "CI failed, how do I debug?"

1. Check the PR for red ✗ status checks
2. Click "Details" link next to the failing check
3. Find the failing step in the logs
4. See [WORKFLOWS.md](WORKFLOWS.md#troubleshooting) for solutions

### "I'm a repository admin"

See [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md) for:
- Setting up required status checks
- Configuring branch protection rules
- Managing review requirements
- Enforcing code standards

## 📊 Current Status

- ✅ Backend workflow configured (XUnit tests)
- ✅ Frontend workflow configured (Vitest tests)
- ✅ Quality gates configured (required for merge)
- ✅ Release workflow configured (automation on tags)
- ✅ Documentation complete
- ⏳ TODO: Enable branch protection rules on main

## 🎯 Quality Gate Requirements

Before code can merge to `main`:

1. **Backend Quality Check** ✓
   - .NET builds successfully
   - All XUnit tests pass
   
2. **Frontend Quality Check** ✓
   - TypeScript type checking passes
   - Vite build succeeds
   - All Vitest tests pass

3. **Pull Request Review** ✓
   - At least 1 approval required (configure in branch protection)

## 🔄 Workflow Flow

```
Developer pushes code
         ↓
GitHub Actions starts (automatic)
    ├─ Backend Check → Build + Test
    ├─ Frontend Check → Check + Build + Test
    └─ Quality Gate Result (awaits both)
         ↓
If both pass: ✅ "Ready to merge"
If either fails: ❌ "Fix issues and push again"
         ↓
After review approval + tests pass → Merge to main
         ↓
If tagged as release (v*.*.*) → Release workflow artifacts
```

## 📚 Related Files

- `README.md` - Project overview with CI status badges
- `TESTING.md` - Comprehensive testing guide
- `.gitignore` - Updated with CI artifact patterns

## 🚨 Important Notes

- **All PRs require passing quality gates** - No exceptions
- **Branch protection enforced** - Admin cannot bypass
- **Test locally first** - Avoid CI failures
- **Keep documentation updated** - Workflows evolve

## 📞 Support

1. Check the relevant documentation file above
2. Review workflow logs in GitHub Actions tab
3. Ask a teammate
4. Create an issue for repeated problems

---

**Version:** 1.0 (April 3, 2026)  
**Status:** Ready for production use  
**Next:** Enable branch protection rules (see BRANCH_PROTECTION.md)
