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
DB_HOST=localhost
DB_PORT=3306
DB_NAME=drug_checker_ai
DB_USER=root
DB_PASSWORD=
JWT_ACCESS_SECRET=change_me_access_secret
JWT_REFRESH_SECRET=change_me_refresh_secret
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
RXNAV_BASE_URL=https://rxnav.nlm.nih.gov/REST
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

Protected routes require:

```http
Authorization: Bearer <accessToken>
```

## Authentication

### Register

```http
POST /api/users/register
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
```

```json
{
  "refreshToken": "<refreshToken>"
}
```

### Logout

```http
POST /api/users/logout
Authorization: Bearer <accessToken>
```

### Get Profile

```http
GET /api/users/profile
Authorization: Bearer <accessToken>
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

- `severity`
- `effect`
- `recommendation`
- `source`
- `aiExplanation`

If no verified local interaction is found, `verified` is returned as `false` and Gemini is not called.

## Interaction History

All history routes are protected. Users can only access their own history.

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

### Delete Report

```http
DELETE /api/reports/:id
Authorization: Bearer <accessToken>
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
