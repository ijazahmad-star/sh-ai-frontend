# SH Smart AI Assistant - Frontend Application

## Project Overview
SH Smart AI Assistant Frontend is a Next.js application that provides an intuitive interface for interacting with AI agents, managing documents and system prompts, and handling conversations. The application integrates with the FastAPI backend and Supabase for authentication and data storage, enabling efficient document retrieval and conversational AI capabilities

## Tech Stack
+ Framework: Next.js
+ Language: TypeScript
+ Styling: Tailwind CSS
+ Authentication: NextAuth.js with Supabase
+ Database: Supabase (PostgreSQL)
+ Real-time: Supabase Realtime
+ Prisma

## Prerequisites
+ Node.js 18.17 or higher
+ npm, yarn, pnpm, or bun
+ Supabase account and project
+ Backend API running (FastAPI service)

## Installation & Setup

### 1. Clone Repo
```bash
git clone https://github.com/strategisthub/sh-ai-assistant-fe.git
cd sh-ai-assistant-fe
```

### 2. Install Dependencies
```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install

# Using bun
bun install
```

### 3. Environment Configuration
Create a .env.local file in the root directory:
```bash
# Database Configuration
DATABASE_URL=your_supabase_database_url

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000

# API Backend Configuration
NEXT_PUBLIC_API_BASE=http://localhost:8000/api/v1

NEXT_PUBLIC_APP_URL=http://localhost:3000

```
### 4. Generate NextAuth Secret
```bash
# Generate a secure secret
openssl rand -base64 32

# Or use online tools to generate a secure random string
```

### 5. Set up Supabase
+ Create a new project in Supabase
+ Enable the following extensions:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
+ Run the database schema migrations (see Database Schema section)

### 6. Run Development Server
```bash
# Using npm
npm run dev

# Using yarn
yarn dev

# Using pnpm
pnpm dev

# Using bun
bun dev
```

## Project Structure
```text
sh-smart-ai-assistant-frontend/
├── app/
│   ├── admin/
│   │   ├── users/
│   │       └── page.tsx
│   ├── api/
│   │   ├── admin/
│   │   │   └── users/
|   |   |       |    └── [id]/
|   |   |       |           └──delete-user
|   |   |       |               └──route.ts
|   |   |       |           └──kb-access
|   |   |       |               └──route.ts
│   │   │       └── route.ts
│   │   ├── auth/
│   │   │   └── [...nextauth]/
|   │   │   |       └──route.ts
│   │   │   └── signup/
|   │   │          └──route.ts
│   │   └── chat/
│   │   │   └── conversations/
|   |   |   |       └── [id]/
|   │   │   |       |     └──route.ts
|   │   │   |       └──route.ts
│   │   │   └── messages/
|   │   │          └──route.ts
│   │   └── user/
│   │       └── kb-access/
|   │             └──[userid]
|   │                  └──route.ts
│   ├──  auth/
|   │       └──signin
|   │       |    └──page.tsx
|   │       └──signup
|   │            └──page.tsx
│   ├──  chat/
|   │       └──page.tsx
│   ├──  dashboard/
|   │       └──page.tsx
│   ├──  knowledge-base/
|   │       └──page.tsx
│   ├──  prompt/
│   │       └── system-prompts/
|   │                  └──page.tsx
│   ├── layout.tsx
│   ├── favicon.ico
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   ├── AddNewPrompt.tsx/
│   ├── Navigation.tsx
│   ├── SessionProvider.tsx
│   ├── SystemPromptActions.tsx
│   └── SystemPrompts.tsx
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   └── prompts.ts
├── types/
│   ├── chat.ts
│   ├── next-auth.ts
│   ├── prompt.ts
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── public/
│   ├── SH-logo.png
│   └── strategisthub_logo.jpeg
├── scripts/
│   └── create-admin.ts
├── .env.local
├── .env
├── eslint.config.mjs
├── prisma.config.ts
├── next.config.ts
├── next.config.js
├── tsconfig.ts
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── package-lock.json
└── README.md
```