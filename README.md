# TrackHire 🚀

TrackHire is a premium SaaS job application tracker built with modern web technologies. It provides a scalable, secure, and responsive dashboard for users to manage their job applications, track progress through different hiring stages, and gain insights via analytics.

## 🌟 Project Overview

TrackHire simplifies the job search process by offering a centralized dashboard to log applications, track interview stages, and manage offer negotiations. Designed with a sleek and modern UI, it ensures a seamless experience for job seekers to monitor their hiring funnel and success metrics.

## ✨ Features

- **Job Application Tracker:** Log and manage job postings, company details, locations, and priorities.
- **Status Funnel:** Track jobs through various stages (Applied, Assessment, HR Interview, Technical Interview, Final Interview, Offer Received, Accepted, Rejected).
- **Analytics Dashboard:** Visualize your job search success rate, active funnel sizes, interview rates, and rejection metrics.
- **Secure Authentication:** Robust user login, registration, password recovery, and email verification powered by Supabase.
- **Modern & Responsive UI:** A sleek, glassmorphism-inspired design with full dark mode support, built using Tailwind CSS and Framer Motion.
- **Type-Safe:** Fully typed with TypeScript, using Zod for robust form validation to ensure high code quality.

## 🏗️ Architecture & Tech Stack

TrackHire is built upon a modern, highly scalable architecture:

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Language:** TypeScript
- **Database, Auth & Backend API:** [Supabase](https://supabase.com/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components & Tooling:** Shadcn UI, Base UI, TanStack Table
- **Animations:** Framer Motion
- **Form Handling:** React Hook Form with Zod Validation
- **Data Visualization:** Recharts
- **Icons:** Lucide React

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

### Installation

1. Clone the repository (if applicable) and navigate to the project directory:
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

4. Open [http://localhost:3000](http://localhost:3000) with your browser to explore the dashboard.

## 🛠️ Project Structure

- `/app`: Next.js App Router root containing all pages, routes, and authentication flows.
- `/components`: Modular, reusable UI building blocks and composite view sections (`ui/`, dashboards, navigation).
- `/lib`: Utility functions and essential Supabase configuration files (`client.ts`, `server.ts`).
- `/public`: Static assets including brand assets (logos, icons) and metadata.

## 📄 License

This project is intended for personal and commercial usage. Make sure to adhere to licensing criteria of downstream dependencies.
