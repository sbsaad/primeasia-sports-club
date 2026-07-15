# Primeasia University Sports Club

A full-stack Next.js web app for the Primeasia University Sports Club Executive Committee recruitment process. Students sign in with Google, submit their details and CV, and admins can browse/download all applications.

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Auth**: Auth.js v5 (NextAuth) — Google OAuth only
- **Database**: Neon Postgres + Drizzle ORM
- **File Storage**: Vercel Blob
- **Styling**: Tailwind CSS v4 (Navy + Gold design system)
- **Deploy**: Vercel Hobby (free tier)

---

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd primeasia-sports-club
npm install
```

### 2. Set Up Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials |
| `AUTH_SECRET` | Run: `openssl rand -base64 32` |
| `DATABASE_URL` | Neon dashboard → Connection string |
| `BLOB_READ_WRITE_TOKEN` | Vercel Dashboard → Storage → Blob |
| `ADMIN_EMAILS` | Comma-separated list of admin emails |
| `NEXTAUTH_URL` | Your app URL (e.g. `http://localhost:3000`) |

---

## Setup Guides

### Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Set **Application type** to "Web application"
6. Add **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://pausc.vercel.app/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret** into your `.env.local`

### Neon Postgres Database

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the **connection string** (looks like `postgresql://user:pass@host/db?sslmode=require`)
4. Add it as `DATABASE_URL` in your `.env.local`
5. Run the database migration:
   ```bash
   npm run db:push
   ```

### Vercel Blob Storage

1. Deploy your project to [Vercel](https://vercel.com) first
2. In your Vercel project dashboard, go to **Storage → Create Database → Blob**
3. Connect the Blob store to your project
4. Copy the `BLOB_READ_WRITE_TOKEN` from the Blob dashboard
5. Add it to your environment variables

### Setting Admin Emails

Set `ADMIN_EMAILS` to a comma-separated list of Google account emails that should have admin access:

```env
ADMIN_EMAILS=admin@university.edu,rector@university.edu
```

These users will see the "Admin" link in the navbar and can access `/admin`.

---

## Running Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Database Commands

```bash
# Push schema to database (initial setup or schema changes)
npm run db:push

# Generate migration files
npm run db:generate

# Open Drizzle Studio (visual DB browser)
npm run db:studio
```

---

## Deploying to Vercel

1. Push your code to GitHub
2. Connect the repo to [Vercel](https://vercel.com)
3. Add all environment variables in Vercel Dashboard → Settings → Environment Variables
4. Deploy!

> **Note**: Make sure to update the `NEXTAUTH_URL` to your Vercel deployment URL and add the production redirect URI to your Google OAuth credentials.

---

## Semester Calculation

Student IDs encode admission term in the first 3 digits:
- **Format**: `YYTXXXXXXX` where `YY` = year (e.g. `24` = 2024), `T` = term (1=Spring, 2=Summer, 3=Fall)
- **Example**: `242` = Summer 2024
- **Current term** is hardcoded to **Summer 2026 (262)**

| Semester | Status |
|---|---|
| 1–6 | Regular applicant |
| 7–12 | ⭐ Priority applicant |
| 13+ | ⛔ Irregular — discouraged to apply |

---

## ZIP Download Structure

When admins click "Download All (ZIP)", the file is organized as:

```
primeasia_sports_club_cvs_TIMESTAMP.zip
├── President/
│   ├── Student_Name.pdf
│   └── Student_Name_details.txt
├── Vice_President/
│   ├── Student_Name.pdf
│   └── Student_Name_details.txt
├── General_Secretary/
│   ├── Student_Name.pdf
│   └── Student_Name_details.txt
└── Treasurer/
    ├── Student_Name.pdf
    └── Student_Name_details.txt
```

Each `_details.txt` contains the student's full registration details (name, email, student ID, phone, semester, position, submission timestamp).

---

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing / sign-in page
│   ├── dashboard/page.tsx      # Student dashboard
│   ├── upload/page.tsx         # CV upload page
│   ├── admin/page.tsx          # Admin view
│   └── api/
│       ├── auth/[...nextauth]/ # Auth.js handlers
│       └── admin/download-zip/ # ZIP generation
├── components/
│   ├── Navbar.tsx
│   ├── StudentForm.tsx         # Multi-step form
│   ├── CVUploadZone.tsx        # Drag-and-drop uploader
│   ├── SuccessCard.tsx         # Post-submission state
│   └── AdminTable.tsx          # Admin table with search
├── lib/
│   ├── auth.ts                 # Auth.js config
│   ├── semester.ts             # Semester calculation
│   ├── validations.ts          # Zod schemas
│   └── db/
│       ├── schema.ts           # Drizzle schema
│       └── index.ts            # DB client
├── actions/
│   ├── submit-cv.ts            # CV upload server action
│   └── admin.ts                # Admin data server action
├── middleware.ts               # Route protection
└── .env.example
```

---

## License

MIT — Primeasia University Sports Club
