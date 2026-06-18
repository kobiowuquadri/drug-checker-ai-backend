# Drug Checker AI Backend

Drug Checker AI is an Express.js + TypeScript backend for searching drugs through RxNav, checking locally verified drug interactions, explaining verified interaction results with Google Gemini, and storing user history and reports in MySQL.

Gemini is only used to explain interaction records that already exist in the local MySQL interaction database. It is not used as the source of medical interaction data.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MySQL
- Sequelize ORM
- JWT authentication
- bcrypt/bcryptjs
- axios
- RxNav API
- Google Gemini API

## Project Structure

```text
src/
  config/
  constants/
  controllers/
  database/
    migrations/
    seeders/
  middlewares/
  modules/
  notifications/
  routes/
  schemas/
  services/
  storage/
  types/
  utils/
  validations/
```

## Getting Started

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, use this instead if `cp` is unavailable:

```powershell
Copy-Item .env.example .env
```

Run the development server:

```bash
npm run dev
```

If PowerShell blocks `npm.ps1`, run the same script through:

```powershell
npm.cmd run dev
```

Build and start:

```bash
npm run build
npm start
```

## Environment Variables

```bash
PORT=5000
CLIENT_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=drug_checker_ai
DB_USER=root
DB_PASSWORD=
JWT_ACCESS_SECRET=change_me_access_secret
JWT_REFRESH_SECRET=change_me_refresh_secret
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
USE_GEMINI_PAIR_EXPLANATIONS=false
RXNAV_BASE_URL=https://rxnav.nlm.nih.gov/REST
AUTO_SEED_INTERACTIONS=true
ADMIN_EMAILS=admin@example.com
```

## Base URLs

Routes are mounted under both prefixes:

```text
/api
/api/v1
```

Examples below use `/api`.

## Response Format

Most service responses follow the existing project response shape:

```json
{
  "message": "Request completed successfully",
  "success": true,
  "statusCode": 200,
  "data": {}
}
```

Authentication uses HTTP-only cookies:

- `accessToken`
- `refreshToken`

Register, login, and refresh set these cookies automatically. Logout clears them. Protected routes read `accessToken` from cookies first, and still support `Authorization: Bearer <accessToken>` as a fallback for API testing.

Browser clients must send credentials:

```ts
fetch("http://localhost:5000/api/users/profile", {
  credentials: "include"
})
```

Axios example:

```ts
axios.get("http://localhost:5000/api/users/profile", {
  withCredentials: true
})
```

## Authentication

### Register

```http
POST /api/users/register
Set-Cookie: accessToken, refreshToken
```

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!"
}
```

### Login

```http
POST /api/users/login
Set-Cookie: accessToken, refreshToken
```

```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```

### Refresh Access Token

```http
POST /api/users/refresh-token
Cookie: refreshToken=<refreshToken>
Set-Cookie: accessToken, refreshToken
```

No body is required when the `refreshToken` cookie is present. A body refresh token is still accepted as a fallback for API testing.

### Logout

```http
POST /api/users/logout
Cookie: accessToken=<accessToken>; refreshToken=<refreshToken>
```

### Get Profile

```http
GET /api/users/profile
Cookie: accessToken=<accessToken>
```

## Drugs

### Search Drugs

```http
GET /api/drugs/search?q=ibuprofen
```

Uses RxNav:

```text
https://rxnav.nlm.nih.gov/REST/drugs.json?name={query}
```

### Get Drug Details

```http
GET /api/drugs/:rxcui
```

Example:

```http
GET /api/drugs/5640
```

Uses RxNav:

```text
https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui}/properties.json
```

## Interactions

### Check Interactions

```http
POST /api/interactions/check
```

Request rules:

- Minimum 2 drugs
- Maximum 5 drugs
- Each drug requires `rxcui` and `name`
- If a valid auth cookie or bearer token is provided, the result is auto-saved to that user's history

```json
{
  "drugs": [
    {
      "rxcui": "5640",
      "name": "Ibuprofen"
    },
    {
      "rxcui": "1191",
      "name": "Aspirin"
    }
  ]
}
```

The service generates all possible drug pairs, checks the local `drug_interactions` table in both directions, and returns:

- `duplicateTherapies`
- `safetySummary`
- `aiSummary`
- `interactions`: verified interaction records only
- `historySaved`
- `historyId`

Unverified pairs are not returned individually. Their count is available as `safetySummary.unverifiedPairs`.

If multiple drugs are selected, every pair is checked. For example, 4 drugs creates 6 checks:

```text
A + B
A + C
A + D
B + C
B + D
C + D
```

Example multi-drug payload:

```json
{
  "drugs": [
    {
      "rxcui": "5640",
      "name": "Ibuprofen"
    },
    {
      "rxcui": "1191",
      "name": "Aspirin"
    },
    {
      "rxcui": "11289",
      "name": "Warfarin"
    },
    {
      "rxcui": "29046",
      "name": "Lisinopril"
    }
  ]
}
```

Duplicate therapy detection is also included. For example, selecting two ibuprofen-containing products returns a duplicate warning even if no verified drug-drug interaction exists:

```json
{
  "drugs": [
    {
      "rxcui": "1100070",
      "name": "famotidine 26.6 MG / ibuprofen 800 MG Oral Tablet [Duexis]"
    },
    {
      "rxcui": "206905",
      "name": "ibuprofen 400 MG Oral Tablet [Ibu]"
    }
  ]
}
```

Before checking the local database, the service also asks RxNav for each drug's ingredient concepts using `related.json?tty=IN+MIN+PIN`. This allows product RXCUIs, branded drugs, and clinical dose forms from search results to match ingredient-level seed records like `Ibuprofen` (`5640`) and `Aspirin` (`1191`).

Example verified test payload:

```json
{
  "drugs": [
    {
      "rxcui": "5640",
      "name": "Ibuprofen"
    },
    {
      "rxcui": "1191",
      "name": "Aspirin"
    }
  ]
}
```

Example product-to-ingredient payload that should also match the ibuprofen + aspirin seed row:

```json
{
  "drugs": [
    {
      "rxcui": "1100070",
      "name": "famotidine 26.6 MG / ibuprofen 800 MG Oral Tablet [Duexis]"
    },
    {
      "rxcui": "1191",
      "name": "Aspirin"
    }
  ]
}
```

## Interaction History

All history routes are protected. Users can only access their own history.

Interaction checks are also saved automatically when `/api/interactions/check` receives a valid bearer token.

### Create History

```http
POST /api/history
Authorization: Bearer <accessToken>
```

```json
{
  "selectedDrugs": [
    {
      "rxcui": "5640",
      "name": "Ibuprofen"
    },
    {
      "rxcui": "1191",
      "name": "Aspirin"
    }
  ],
  "results": []
}
```

### List History

```http
GET /api/history
Authorization: Bearer <accessToken>
```

### Get History Item

```http
GET /api/history/:id
Authorization: Bearer <accessToken>
```

### Delete History Item

```http
DELETE /api/history/:id
Authorization: Bearer <accessToken>
```

## Reports

All report routes are protected. Reports are stored in MySQL. PDF generation is not included yet.

### Generate Report

```http
POST /api/reports/generate
Authorization: Bearer <accessToken>
```

```json
{
  "title": "Jane's Interaction Report",
  "notes": "Patient asked for pharmacist review before taking these together.",
  "selectedDrugs": [
    {
      "rxcui": "5640",
      "name": "Ibuprofen"
    },
    {
      "rxcui": "1191",
      "name": "Aspirin"
    }
  ],
  "interactionResults": []
}
```

The report service calculates and stores a `severitySummary` from verified interaction results.

New report fields:

- `status`: `GENERATED`, `REVIEWED`, or `ARCHIVED`
- `notes`: optional user notes
- `pdfUrl`: nullable placeholder for future PDF generation

### List Reports

```http
GET /api/reports
Authorization: Bearer <accessToken>
```

### Get Report

```http
GET /api/reports/:id
Authorization: Bearer <accessToken>
```

### Update Report

```http
PATCH /api/reports/:id
Authorization: Bearer <accessToken>
```

```json
{
  "status": "REVIEWED",
  "notes": "Reviewed with a pharmacist."
}
```

### Delete Report

```http
DELETE /api/reports/:id
Authorization: Bearer <accessToken>
```

## Admin Interaction Management

Admin routes are protected by JWT and `ADMIN_EMAILS`.

```env
ADMIN_EMAILS=admin@example.com,owner@example.com
```

Create a verified interaction record:

```http
POST /api/admin/interactions
Authorization: Bearer <adminAccessToken>
```

```json
{
  "drugAName": "Ibuprofen",
  "drugBName": "Aspirin",
  "drugARxcui": "5640",
  "drugBRxcui": "1191",
  "severity": "MODERATE",
  "effect": "Combined use may increase the risk of gastrointestinal bleeding and may reduce aspirin's antiplatelet effect when taken at the same time.",
  "recommendation": "Avoid routine combined use unless advised by a clinician.",
  "source": "Admin verified data"
}
```

Other admin endpoints:

```http
GET /api/admin/interactions
GET /api/admin/interactions/:id
PUT /api/admin/interactions/:id
DELETE /api/admin/interactions/:id
```

## Sequelize Models

### User

- `id`
- `name`
- `email`
- `password`
- `refreshToken`
- `refreshTokenExpiresAt`
- `createdAt`
- `updatedAt`

### DrugInteraction

- `id`
- `drugAName`
- `drugBName`
- `drugARxcui`
- `drugBRxcui`
- `severity`
- `effect`
- `recommendation`
- `source`
- `createdAt`
- `updatedAt`

### InteractionHistory

- `id`
- `userId`
- `selectedDrugs`
- `results`
- `createdAt`
- `updatedAt`

### Report

- `id`
- `userId`
- `title`
- `selectedDrugs`
- `interactionResults`
- `severitySummary`
- `status`
- `notes`
- `pdfUrl`
- `createdAt`
- `updatedAt`

## Severity Enum

```text
LOW
MODERATE
HIGH
```

## Seeded Interaction Data

The seeder includes:

- Ibuprofen + Aspirin
- Warfarin + Aspirin
- Metformin + Alcohol
- Lisinopril + Potassium Supplement
- Simvastatin + Clarithromycin
- Amoxicillin + Methotrexate
- Ciprofloxacin + Tizanidine

Each seed row stores:

- `severity`
- `effect`
- `recommendation`
- `source`

## Database Notes

The app currently imports all Sequelize schemas and runs the existing `sequelize.sync()` flow on startup.

By default, startup also idempotently seeds the local verified interaction rows. To disable that behavior:

```bash
AUTO_SEED_INTERACTIONS=false
```

Migration and seeder files are also included under:

```text
src/database/migrations
src/database/seeders
```

Use those files with a Sequelize migration runner if you add one later.

## Scripts

```json
{
  "dev": "nodemon --watch \"src/**/*.ts\" --exec tsx src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "postinstall": "tsc"
}
```
