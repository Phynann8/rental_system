# Rental System (Full Stack)

## CI/CD Status

[![Backend Build & Test](https://github.com/{{ github.repository_owner }}/rental_system/actions/workflows/backend.yml/badge.svg)](https://github.com/{{ github.repository_owner }}/rental_system/actions/workflows/backend.yml)
[![Frontend Build & Test](https://github.com/{{ github.repository_owner }}/rental_system/actions/workflows/frontend.yml/badge.svg)](https://github.com/{{ github.repository_owner }}/rental_system/actions/workflows/frontend.yml)
[![Quality Gates](https://github.com/{{ github.repository_owner }}/rental_system/actions/workflows/quality-gates.yml/badge.svg)](https://github.com/{{ github.repository_owner }}/rental_system/actions/workflows/quality-gates.yml)

## Overview

This repository includes a full-stack rental property management solution:
- **Frontend**: React 19 + TypeScript + Vite SPA in `rentalmgr---professional-property-management/`
- **Backend**: ASP.NET Core 9 Razor Pages app in `RentalSystem.Web/`
- **Database**: SQL Server (LocalDB) with Entity Framework Core
- **Testing**: XUnit (backend) + Vitest (frontend) with comprehensive test coverage
- **CI/CD**: GitHub Actions with automated quality gates

## Goal for a New Developer

Provide a clean, maintainable codebase:
- modular structure
- good naming and comments
- strong architecture documentation
- incremental improvement path

## Folder Structure

- `rentalmgr---professional-property-management/`
  - `App.tsx`: entrypoint; sidebar + header + page routes
  - `pages/`: UI screens (Dashboard, Buildings, Rooms, etc.)
  - `services/geminiService.ts`: optional AI suggestion feature

- `RentalSystem.Web/`
  - `Program.cs`: app startup, DI, seed data, request pipeline
  - `Data/RentalDbContext.cs`: EF Core context and decimal config
  - `Data/DbInitializer.cs`: demo data seeding
  - `Models/`: domain entities (Building, Room, Tenant, etc.)
  - `Pages/`: Razor Pages for front-end functionality

## Quick Start

### Backend

1. Open solution in Visual Studio or `dotnet` CLI
2. `dotnet restore`
3. Configure the database connection only if you are not using the default LocalDB development fallback:
   `dotnet user-secrets set --project RentalSystem.Web "ConnectionStrings:DefaultConnection" "Server=YOUR_SERVER;Database=RentalSystemDb;User Id=YOUR_USER;Password=YOUR_PASSWORD;Encrypt=false;TrustServerCertificate=true;"`
4. `dotnet run --project RentalSystem.Web --launch-profile http`

Local development now works without a committed connection string:
- Development falls back to `Server=(localdb)\\MSSQLLocalDB;Database=RentalSystemDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=true`
- Use `ConnectionStrings:DefaultConnection` in user secrets or `ConnectionStrings__DefaultConnection` in the environment to override it
- EF Core migrations and demo seed data are applied automatically on startup in Development

### Frontend

1. `cd rentalmgr---professional-property-management`
2. `npm install`
3. create `.env.local` with `GEMINI_API_KEY=your-key`
4. `npm run dev`

### Run Together
- Backend: `http://localhost:5180` or `https://localhost:7181`
- Frontend: `http://localhost:3000`

## CI/CD Pipeline

All code pushed to GitHub is automatically validated through quality gates:

### Automated Checks (Required for Merge)
- ✅ **Backend Build & Test** - Compiles .NET code and runs XUnit tests
- ✅ **Frontend Build & Test** - Type checks, builds Vite bundle, runs vitest suite
- ✅ **Quality Gate Status** - Aggregates all checks; fails if any check fails

### Before Pushing

Run these locally to avoid CI failures:

**Backend:**
```bash
cd RentalSystem.Tests
dotnet test
dotnet build --configuration Release
```

**Frontend:**
```bash
cd rentalmgr---professional-property-management
npm test -- --run
npm run build
npx tsc --noEmit
```

### Workflow Files

- `.github/workflows/quality-gates.yml` - Main validation gate (required for PRs)
- `.github/workflows/backend.yml` - Detailed backend checks
- `.github/workflows/frontend.yml` - Detailed frontend checks
- `.github/workflows/release.yml` - Automated release on tag

### Documentation

For detailed CI/CD setup and configuration, see:
- [Workflow Documentation](.github/WORKFLOWS.md)
- [Branch Protection Rules](.github/BRANCH_PROTECTION.md)

### Pull Request Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Push to GitHub and create Pull Request
4. Automated checks run (see status in PR)
5. Request review from team member
6. Once approved and checks pass, merge to main
7. Quality gates run on main; if tag is created, release workflow publishes artifacts


## Architecture Notes

- Backend is currently Razor Pages and does not yet expose full API endpoints for SPA.
- Recommended next step: create `RentalSystem.Web/Controllers/Api/*` and call from React via `fetch`/Axios.
- Add Swagger via `AddSwaggerGen()` to backend for API docs.

## Clean Code Guidelines (for this project)

1. Keep functions small and single responsibility.
2. Use descriptive naming (e.g., `RoomStatus`, `GetApartmentSummary`).
3. Add summary comments above public methods.
4. Keep model validation close to DTOs and requests.
5. Prefer strongly typed objects in React props and state.
6. Avoid hard-coded magic values (extract constants).

## Onboarding Guide for New Developer

1. Read `RentalSystem.Web/Program.cs`: app startup and data seeding.
2. Read `RentalSystem.Web/Data/RentalDbContext.cs`: data model config.
3. Run the solution and verify seed data appears.
4. Explore frontend routes in `App.tsx` and page components.
5. Add a first API route:
   - in backend: `GET /api/buildings` returning `Building` list
   - in frontend: fetch and display building table
6. Add auth guard via ASP.NET Identity.

## Improvements to Do

- Build REST endpoints for resource operations and use in SPA
- Add Auth/Navigate workflow (login/roles)
- Add end-to-end tests (Playwright, xUnit)
- Add CI pipeline + linting
- Add detailed docs: API contract, ER diagrams, deployment
