# Project Description

## Overview

`RentalMgr` is a rental property management system for small-to-medium building or apartment operations. The codebase manages the core rental workflow end to end:

- property and room setup
- tenant registration
- lease creation
- monthly utility meter readings
- invoice generation
- payment collection
- operational dashboard reporting

This repository contains two application surfaces:

1. `RentalSystem.Web/`
   An ASP.NET Core application that contains the database model, seed data, Razor Pages, and protected REST API controllers.
2. `rentalmgr---professional-property-management/`
   A React + TypeScript single-page app that consumes the backend `/api/*` routes.

## Solution Structure

### Backend

Path: `RentalSystem.Web/`

Role:

- system of record for business data
- SQL Server persistence with Entity Framework Core
- server-rendered Razor Pages
- JSON REST endpoints for the SPA
- local cookie-based authentication

### Frontend SPA

Path: `rentalmgr---professional-property-management/`

Role:

- authenticated operations dashboard UI
- CRUD-style management screens for core rental workflows
- API client for backend routes
- optional AI insight generation on the dashboard

## Technology Stack

### Backend Stack

- ASP.NET Core 9 (`net9.0`)
- Razor Pages
- MVC Controllers / REST API
- Entity Framework Core 8 with SQL Server provider
- SQL Server LocalDB for local development fallback
- Cookie authentication
- Swashbuckle / Swagger in development

Key backend files:

- `RentalSystem.Web/Program.cs`
- `RentalSystem.Web/Data/RentalDbContext.cs`
- `RentalSystem.Web/Data/DatabaseStartup.cs`
- `RentalSystem.Web/Data/DbInitializer.cs`

### Frontend Stack

- React 19
- TypeScript 5
- Vite 6
- React Router DOM 7
- Recharts 3 for charts
- Tailwind CSS via CDN script in `index.html`
- Google GenAI SDK (`@google/genai`) for optional dashboard insights

Key frontend files:

- `rentalmgr---professional-property-management/App.tsx`
- `rentalmgr---professional-property-management/services/api.ts`
- `rentalmgr---professional-property-management/services/geminiService.ts`

## What The Project Currently Does

### Authentication

The SPA authenticates against backend cookie auth.

Implemented routes:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Current auth model:

- local single-user auth service
- development default account: `manager` / `Rental123!`
- non-development requires configured credentials via `AuthOptions`

### Dashboard

Implemented in:

- backend: `RentalSystem.Web/Controllers/DashboardController.cs`
- frontend: `rentalmgr---professional-property-management/pages/DashboardLive.tsx`

Current dashboard functions:

- total buildings
- total rooms
- occupied rooms
- occupancy rate
- active tenants
- unpaid invoice count
- unpaid invoice amount
- projected rent revenue
- cash collected this month
- 6-month revenue trend
- recent payment and lease activity feed
- optional AI-generated action suggestions

### Buildings / Properties

Implemented in:

- backend: `RentalSystem.Web/Controllers/BuildingsController.cs`
- frontend: `rentalmgr---professional-property-management/pages/BuildingsLive.tsx`

Functions:

- list buildings
- create building
- update building
- store per-building water rate
- store per-building electricity rate
- compute active / maintenance / inactive display state from room status

### Rooms

Implemented in:

- backend: `RentalSystem.Web/Controllers/RoomsController.cs`
- frontend: `rentalmgr---professional-property-management/pages/RoomsLive.tsx`

Functions:

- list rooms
- create room
- update room
- load room lookup data for building and room type selection
- show active tenant for occupied room
- show lease end date
- flag rooms with overdue unpaid invoices

### Tenants

Implemented in:

- backend: `RentalSystem.Web/Controllers/TenantsController.cs`
- frontend: `rentalmgr---professional-property-management/pages/TenantsLive.tsx`

Functions:

- list tenants
- create tenant
- update tenant
- show current room assignment
- show lease expiry
- derive tenant status as `Active`, `Pending`, or `Former`

### Leases / Contracts

Implemented in:

- backend: `RentalSystem.Web/Controllers/LeasesController.cs`
- frontend: `rentalmgr---professional-property-management/pages/NewLeaseLive.tsx`

Functions:

- load available tenants and vacant rooms for lease creation
- create lease contract
- assign tenant to room
- move room to occupied state
- capture rent amount and deposit amount

### Utility Readings

Implemented in:

- backend: `RentalSystem.Web/Controllers/ReadingsController.cs`
- frontend: `rentalmgr---professional-property-management/pages/ReadingsLive.tsx`

Functions:

- select a building
- load occupied rooms for that building
- read previous water and electric meter values
- submit new monthly readings
- store readings as historical meter entries

### Billing And Invoices

Implemented in:

- backend: `RentalSystem.Web/Controllers/InvoicesController.cs`
- frontend: `rentalmgr---professional-property-management/pages/InvoicesLive.tsx`
- Razor Pages: `RentalSystem.Web/Pages/Billing/*`

Functions:

- list invoices by selected month and year
- summarize invoiced, collected, pending, and overdue totals
- generate monthly invoices for active leases
- calculate utility charges from the latest two meter readings
- create invoice line items for rent, water, and electricity
- receive partial or full payments
- update invoice payment status

Implemented billing routes:

- `GET /api/invoices`
- `POST /api/invoices/generate`
- `POST /api/invoices/{invoiceId}/payments`

### Printing

Implemented in:

- Razor Pages print templates:
  - `RentalSystem.Web/Pages/Print/Invoice.cshtml`
  - `RentalSystem.Web/Pages/Print/Receipt.cshtml`
- React preview screen:
  - `rentalmgr---professional-property-management/pages/PrintPreview.tsx`

Functions:

- printable invoice view
- printable receipt view
- browser print preview screen in SPA

### Reports

Implemented in:

- Razor Page: `RentalSystem.Web/Pages/Reports/Index.cshtml.cs`
- React page: `rentalmgr---professional-property-management/pages/Reports.tsx`

Current report logic available on the backend page:

- total revenue year to date
- current occupancy rate
- outstanding balance

Current SPA report page status:

- presentational/demo UI
- chart and summary values are hard-coded in the React page

### Settings

Implemented in:

- Razor Page: `RentalSystem.Web/Pages/Settings/Index.cshtml`
- React page: `rentalmgr---professional-property-management/pages/Settings.tsx`

Current status:

- navigation and settings UI exist
- React settings screen is currently presentational
- backend does not yet expose a settings API for persisted system preferences

## Domain Model Built In The Project

The main business model is relational and centered around rental operations.

### Core Entities

- `Building`
  Stores property-level details and utility prices.
- `RoomType`
  Defines room category and base rent price.
- `Room`
  Represents an individual rentable unit inside a building.
- `Tenant`
  Stores renter identity and contact information.
- `Contract`
  Represents a lease agreement between one tenant and one room.
- `UtilityMeter`
  Stores point-in-time water or electricity readings per room.
- `Invoice`
  Represents a billing cycle charge for a contract.
- `InvoiceItem`
  Represents individual line items inside an invoice.
- `Payment`
  Represents money collected against an invoice.

### Relationships

- one `Building` has many `Room`
- one `RoomType` has many `Room`
- one `Room` has many `UtilityMeter`
- one `Tenant` has many `Contract`
- one `Room` has many `Contract`
- one `Contract` has many `Invoice`
- one `Invoice` has many `InvoiceItem`
- one `Invoice` has many `Payment`

### Important Enums

- `RoomStatus`: `Vacant`, `Occupied`, `Maintenance`
- `ContractStatus`: `Active`, `Ended`, `Terminated`
- `InvoiceStatus`: `Unpaid`, `Partial`, `Paid`
- `MeterType`: `Water`, `Electric`
- `PaymentMethod`: `Cash`, `BankTransfer`, `QRCode`

## Business Rules Implemented

The codebase already enforces several core rental rules:

- a room with an active lease cannot be leased again
- a tenant cannot hold more than one active lease at the same time
- rooms with an active lease remain occupied
- meter readings cannot decrease
- invoice generation skips contracts that already have an invoice for the same month
- invoice total is calculated from rent plus utility usage charges
- payment amount must be positive and cannot exceed remaining balance
- overdue status is derived from due date plus unpaid balance state

## AI Model / External Model Usage

There is no custom-trained machine learning model in this repository.

The only AI integration currently present is:

- file: `rentalmgr---professional-property-management/services/geminiService.ts`
- provider: Google GenAI SDK
- model: `gemini-3-flash-preview`
- use case: generate 3 short dashboard action items from current operational stats

If the Gemini call fails or no API key is configured, the frontend falls back to fixed default suggestions.

## Seed Data And Startup Behavior

Development startup currently does the following:

- resolves a LocalDB connection string if no explicit connection string is provided
- applies EF Core migrations automatically
- seeds demo data when the database is empty

Seeded demo data includes:

- 1 building
- 2 room types
- 4 rooms
- 1 tenant
- 1 active contract
- initial water and electricity meter readings

## Current State Of The Build

### Live, backed by the API

- login/session flow
- dashboard metrics
- buildings
- rooms
- tenants
- new lease workflow
- utility readings
- invoices
- payment recording

### Present but still partly demo or placeholder

- React reports page
- React settings page
- React print preview page
- some older Razor navigation links reference edit/delete/details pages that are not present in this repo

## Short Summary

This project is already a working rental operations platform with a real backend, database model, and authenticated SPA for the main workflows. The strongest implemented areas are property setup, tenant/room management, leases, meter readings, invoice generation, and payment tracking. The main model built by the system is the rental domain model around buildings, rooms, tenants, contracts, invoices, and payments, with one optional AI feature powered by Gemini for dashboard insight suggestions.
