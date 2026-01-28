# SH Smart AI Assistant - Frontend Application

## Project Overview

SH Smart AI Assistant Frontend is a Next.js application that provides an intuitive interface for interacting with AI agents, managing documents and system prompts, and handling conversations. The application integrates with the FastAPI backend and Supabase for authentication and data storage, enabling efficient document retrieval and conversational AI capabilities

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Authentication:** NextAuth.js v4 (Credentials Provider)
- **Database:** PostgreSQL with pgvector extension
- **ORM:** Drizzle ORM
- **UI Components:** Radix UI
- **Icons:** Lucide React
- **Markdown:** React Markdown

## Features

### Core Features

- **AI Chat Interface:** Real-time conversational AI with message history
- **Knowledge Base Management:** Upload, store, and manage documents with vector embeddings
- **Prompt Management:** Create, edit, and manage system prompts
- **Prompt Generator:** Generate optimized prompts for AI interactions
- **User Authentication:** Secure sign-in/sign-up with credential-based authentication
- **Admin Dashboard:** User management, feedback analytics, and KB access control

### User Features

- Personal chat conversations with message feedback (thumbs up/down)
- Document upload and management
- Access to knowledge base documents
- Conversation history and management
- Message sources and context tracking

### Admin Features

- User management (view, edit, delete users)
- Feedback analytics dashboard
- Knowledge base access control
- System prompt management
- User role management (user/admin)

## Prerequisites

- Node.js 18.17 or higher
- PostgreSQL database with pgvector extension
- npm, yarn, pnpm, or bun

## Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/strategisthub/sh-ai-assistant-fe.git
cd sh-ai-assistant-fe
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/myaiapp

# NextAuth Configuration
NEXTAUTH_SECRET=your_secure_secret_key_here
NEXTAUTH_URL=http://localhost:3000
```

### 4. Generate NextAuth Secret

```bash
# Generate a secure secret
openssl rand -base64 32
```

### 5. Database Setup

#### Enable pgvector Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### Run Migrations

```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

#### Create Admin User (Optional)

```bash
npx tsx scripts/create-admin.ts
```

### 6. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```text
my-ai-app/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Homepage
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── admin/                    # Admin pages
│   │   ├── feedback-analytics/   # Feedback analytics dashboard
│   │   └── users/                # User management
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin API endpoints
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── chat/                 # Chat & conversation endpoints
│   │   └── user/                 # User-specific endpoints
│   ├── auth/                     # Auth pages
│   │   ├── signin/               # Sign-in page
│   │   └── signup/               # Sign-up page
│   ├── chat/                     # Chat interface
│   ├── dashboard/                # User dashboard
│   ├── knowledge-base/           # Knowledge base management
│   └── prompts/                  # Prompt management
│       ├── generator/            # Prompt generator
│       └── system-prompts/       # System prompts editor
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   ├── chat/                     # Chat interface components
│   ├── homepage/                 # Homepage components
│   ├── knowledge-base/           # KB management components
│   ├── prompts/                  # Prompt components
│   ├── providers/                # Context providers
│   └── ui/                       # Reusable UI components
├── lib/                          # Core libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── db.ts                     # Database connection
│   ├── schema.ts                 # Drizzle schema definitions
│   ├── prompts.ts                # Prompt utilities
│   └── utils.ts                  # Utility functions
├── types/                        # TypeScript type definitions
│   ├── chat.ts                   # Chat-related types
│   ├── prompt.ts                 # Prompt types
│   └── next-auth.d.ts            # NextAuth type extensions
├── drizzle/                      # Database migrations
├── public/                       # Static assets
└── scripts/                      # Utility scripts
    └── create-admin.ts           # Admin user creation script
```

## Database Schema

### Tables

#### Users

- User authentication and profile information
- Role-based access control (user/admin)
- Email-based authentication with bcrypt password hashing

#### Conversations

- Chat conversation tracking
- Title and timestamp management
- Linked to users for conversation history

#### Messages

- Individual chat messages within conversations
- Support for user, assistant, and system roles
- Source tracking and file references
- JSON-based metadata for context

#### User Files

- Document storage and management
- File metadata and storage paths
- Linked to users for access control

#### Documents

- Vector embeddings for semantic search (1536 dimensions)
- pgvector HNSW index for fast similarity search
- Metadata and content storage
- Linked to user files

#### Prompts

- System prompt management
- User-specific or global prompts
- Active/inactive status tracking
- Versioning support

#### KB Access

- Knowledge base access control per user
- Default KB access management
- Fine-grained permissions

#### Feedbacks

- User feedback on AI responses
- Thumbs up/down ratings
- Optional comments
- Linked to conversations and messages

## API Routes

### Authentication

- `POST /api/auth/[...nextauth]` - NextAuth endpoints
- `POST /api/auth/signup` - User registration

### Chat

- `GET /api/chat/conversations` - List all conversations
- `POST /api/chat/conversations` - Create new conversation
- `GET /api/chat/conversations/[id]` - Get conversation details
- `DELETE /api/chat/conversations/[id]` - Delete conversation
- `POST /api/chat/messages` - Send message
- `POST /api/chat/messages/[messageId]/feedback` - Submit feedback

### Admin

- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/[id]/delete-user` - Delete user
- `PUT /api/admin/users/[id]/kb-access` - Update KB access
- `GET /api/admin/feedback-analytics` - View feedback analytics

### User

- `GET /api/user/kb-access/[userId]` - Get user KB access

## Available Scripts

```bash
# Development
npm run dev                # Start development server

# Production
npm run build              # Build for production
npm run start              # Start production server

# Linting
npm run lint               # Run ESLint

# Database
npm run db:generate        # Generate Drizzle migrations
npm run db:push            # Push schema to database
npm run db:migrate         # Run migrations
npm run db:studio          # Open Drizzle Studio
```

## Key Dependencies

- **next** (16.0.6) - React framework
- **react** (19.2.0) - UI library
- **next-auth** (4.24.13) - Authentication
- **drizzle-orm** (0.45.1) - TypeScript ORM
- **@tanstack/react-table** (8.21.3) - Table management
- **lucide-react** (0.562.0) - Icon library
- **react-markdown** (10.1.0) - Markdown rendering
- **bcryptjs** (3.0.3) - Password hashing

## Environment Variables

Required environment variables in `.env.local`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

## Development Tips

### Database Management

- Use Drizzle Studio to visualize and manage data: `npm run db:studio`
- After schema changes, generate migrations: `npm run db:generate`
- Apply changes: `npm run db:push`

### Authentication

- Admin users need to be created via script: `npx tsx scripts/create-admin.ts`
- Regular users can sign up through the UI
- Session management is handled by NextAuth

### Vector Search

- Documents are stored with 1536-dimensional embeddings
- Uses pgvector HNSW index for fast similarity search
- Requires pgvector extension in PostgreSQL

## Troubleshooting

### Database Connection Issues

- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check pgvector extension is installed

### Authentication Problems

- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies and try again

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`
