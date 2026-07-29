# TrackHire 🚀

TrackHire is a premium SaaS job application tracker built with modern web technologies. It provides a scalable, secure, and responsive dashboard for users to manage their job applications, track progress through different hiring stages, and gain actionable insights.

---

## 🌟 Project Overview

TrackHire simplifies the job search process by offering a centralized dashboard to log applications, track interview stages, manage resumes, and store portfolio links. Designed with a sleek and modern UI (glassmorphism-inspired dark/light modes), it ensures a seamless experience for job seekers to monitor their hiring funnel and success metrics.

## ✨ Core Features & Functionality

### 💼 Job Application Tracker
- **Comprehensive Logging:** Track job titles, company names, URLs, locations, employment types, salaries, priorities, and custom notes.
- **Dynamic Status Funnel:** Move applications through an 8-stage pipeline: `Applied` ➔ `Assessment` ➔ `HR Interview` ➔ `Technical Interview` ➔ `Final Interview` ➔ `Offer Received` ➔ `Accepted` ➔ `Rejected`.
- **Linked Resumes:** Bind specific resume files to individual job applications to track which tailored CV was submitted.

### 📊 Analytics Dashboard
- **Data Visualization:** Built with **Recharts** to visualize job search success rates, active funnel sizes, and rejection metrics over time.

### 📄 Resume & Profile Management
- **Resume Vault:** Upload and manage multiple resume/CV formats securely via Supabase Storage.
- **Important Links:** Centralize portfolio elements, social profiles, resources, and custom prompts under categorized tabs (`Socials`, `Resources`, `Prompts`, `Other`).
- **Profile Customization:** Upload custom avatar images, manage full names, and control personal information directly.

### 🔒 Enterprise-Grade Authentication & Security
- **OAuth & Email Auth:** Support for Google OAuth alongside traditional Email/Password login.
- **Robust Workflows:** Includes Forgot Password, Reset Password, and Email Verification pages.
- **Row Level Security (RLS):** All database operations and storage bucket access are strictly isolated per user using Supabase RLS policies.

---

## 🏗️ Architecture & Tech Stack

TrackHire leverages a cutting-edge JavaScript ecosystem:

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router & React 19)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with custom `globals.css` variable tokens.
- **UI Architecture:** Built on **shadcn/ui** primitives (Radix/Base UI) with custom combinations.
- **Forms & Validation:** `react-hook-form` coupled with `zod` for robust, type-safe client & server validation.
- **Animations:** [Framer Motion](https://www.framer.com/motion/) for smooth layout transitions and micro-interactions.
- **Data Tables:** `@tanstack/react-table` for highly responsive, sortable data grids in the job and links dashboards.

### Backend (Supabase)
- **Database:** PostgreSQL.
- **Authentication:** Supabase SSR Auth (`@supabase/ssr`).
- **Storage:** Supabase Storage Buckets (`resumes`, `profile-images`).
- **Server Actions:** Utilization of Next.js native Server Actions + Supabase Server Clients for data mutation.

---

## 🔄 User Workflow

1. **Onboarding:** User signs up via Email or Google OAuth and verifies their identity. A Row-Level Trigger automatically provisions a user profile in the database.
2. **Setup:** Under `Settings`/`Profile`, the user uploads an avatar and adds their portfolio links (GitHub, LinkedIn) in the `Links` page.
3. **Resume Upload:** User uploads tailored PDF resumes to the `Resumes` page.
4. **Tracking:** As users apply for jobs, they add entries in the `Jobs` dashboard, selecting the specific resume attached and setting a priority.
5. **Funnel Movement:** The user continually updates the job status as they progress through interview stages.
6. **Insight Generation:** The user regularly visits the `Analytics` dashboard to measure their conversion rate across the hiring funnel.

---

## 🛠️ Project Structure

```text
trackhire/
├── app/
│   ├── auth/              # Authentication flows (login, signup, verify-email, reset-password, callback)
│   ├── dashboard/         # Protected application features
│   │   ├── analytics/     # Recharts data visualization
│   │   ├── jobs/          # Core job tracking table/kanban
│   │   ├── links/         # Profile/Portfolio link management
│   │   ├── profile/       # Personal details & password management
│   │   ├── resumes/       # Storage bucket file management
│   │   └── settings/      # General account settings
│   ├── layout.tsx         # Root layout configuring themes and fonts
│   └── page.tsx           # Public landing page (if applicable)
├── components/            
│   ├── ui/                # shadcn primitives (Button, Input, Skeleton, Dialog, etc.)
│   └── *.tsx              # Complex composites (dashboard-sidebar, job-tracker, resume-manager)
├── lib/
│   ├── supabase/          # Supabase client configurations (browser, server, middleware)
│   └── utils.ts           # Utility functions (Tailwind class merging via clsx/twMerge)
└── supabase/
    └── schema.sql         # Source of truth for Postgres tables, triggers, and RLS policies
```

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

Ensure you have the following installed:
- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun
- A Supabase account and project

### Environment Variables

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

1. Go to your Supabase project dashboard.
2. Open the **SQL Editor**.
3. Copy the contents of `supabase/schema.sql` and run it to provision the tables, RLS policies, triggers, and storage buckets.

### Installation

1. Clone the repository and navigate to the project directory:
```bash
cd trackhire
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to explore the TrackHire dashboard.

---

## 📄 License

This project is intended for personal and commercial usage. Make sure to adhere to the licensing criteria of downstream dependencies.
