# Drug Checker AI Backend

Drug Checker AI is an Express.js + TypeScript backend for searching drugs through RxNav, checking locally verified drug interactions, explaining verified interaction results with Google Gemini, and storing user history and reports in MySQL.

Gemini is only used to explain interaction records that already exist in the local MySQL interaction database. It is not used as the source of medical interaction data.

## Project Summary

Drug Checker AI helps users make safer medication decisions by combining:

- medication search by generic or brand name
- local Nigerian/common medicine aliases for hackathon-friendly search coverage
- RxNav integration for standardized drug concepts
- verified local drug-drug interaction records
- duplicate therapy warnings
- AI explanations based only on verified interaction data
- interaction history and report generation

The safest user workflow is to type the generic active ingredient printed on the medication pack. Camera scan and barcode lookup are supported by the frontend as best-effort helpers, but OCR and barcode databases can miss local medicine packs.

## Medical Safety Disclaimer

This application is for educational and hackathon demonstration purposes. It does not replace a doctor, pharmacist, or other qualified healthcare professional.

Important safety rules in this codebase:

- Gemini must not invent drug interaction data.
- Verified interactions come from the local `drug_interactions` table.
- AI summaries and explanations are generated only after verified data is found.
- If no verified local interaction is found, the app should not claim that a combination is safe.
- Users should confirm medication decisions with a clinician or pharmacist.

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
- Optional Google Cloud Vision OCR
- Frontend free OCR fallback with Tesseract.js

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

Recommended local startup for the full app:

1. Start MySQL.
2. Start this backend on `http://localhost:5000`.
3. Start the frontend on `http://localhost:3000`.
4. Register or log in from the frontend.
5. Search by generic names such as `ibuprofen`, `aspirin`, `warfarin`, `metformin`, or `lisinopril`.

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
GOOGLE_CLOUD_VISION_API_KEY=
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

### Scan Medication Label

```http
POST /api/drugs/scan
```

```json
{
  "image": "<base64-image-without-data-url-prefix>",
  "mimeType": "image/jpeg"
}
```

The scan pipeline is:

1. Google Cloud Vision OCR extracts readable label text when `GOOGLE_CLOUD_VISION_API_KEY` is configured and billing is enabled.
2. The backend checks local Nigerian/common product aliases such as Feroglobin, Synriam, Coartem, Artequick, Inbu-400, Ampiclox, Septrin, and Panadol.
3. Gemini Vision interprets the image with the OCR text as supporting evidence when local matching is not enough.
4. The frontend also has a free Tesseract.js OCR fallback for hackathon use when paid OCR is unavailable.

This avoids trusting weak partial OCR like `Fer` as a complete medicine name.

Camera scan is best effort. Poor lighting, glare, handwriting, stylized fonts, and cropped labels can produce wrong text. If scan results are wrong, type the generic active ingredient manually.

Example:

```text
Inbu-400 -> Ibuprofen
Artequick -> Artemisinin + Piperaquine
Acycor Plus -> Aceclofenac + Paracetamol
Feroglobin B12 -> Iron + Folic Acid + Vitamin B12
```

### Barcode Lookup

```http
POST /api/drugs/barcode
```

```json
{
  "barcodeValue": "1234567890123",
  "format": "ean_13"
}
```

Barcode lookup is best effort. Many Nigerian medication barcodes are not indexed in public medicine databases, so barcode failure is expected for some local packs. The recommended fallback is camera label scan or typing the generic ingredient.

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
  "historyId": 12,
  "title": "Jane's Interaction Report",
  "notes": "Patient asked for pharmacist review before taking these together."
}
```

Preferred flow:

1. Run `/api/interactions/check` while logged in.
2. Use the returned `historyId`.
3. Generate the report from that history id.

The report service loads the user's own interaction history, copies the selected drugs and verified interactions, then stores a `severitySummary`.

Direct report generation with `selectedDrugs` and `interactionResults` is still supported for testing, but `historyId` is the cleaner app flow.

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

## Demo Combinations

Useful combinations for judging/demo:

```text
Ibuprofen + Aspirin -> MODERATE
Aspirin + Warfarin -> HIGH
Metformin + Alcohol -> MODERATE/HIGH depending on seeded wording
Lisinopril + Potassium Supplement -> HIGH
Simvastatin + Clarithromycin -> HIGH
Ciprofloxacin + Tizanidine -> HIGH
```

Useful camera/search demo terms:

```text
Inbu-400 -> Ibuprofen
Artequick -> Artemisinin + Piperaquine
Acycor Plus -> Aceclofenac + Paracetamol
P-Alaxin -> Dihydroartemisinin + Piperaquine
TLD -> Tenofovir + Lamivudine + Dolutegravir
RHZE -> Rifampicin + Isoniazid + Pyrazinamide + Ethambutol
```

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
