# 10x Astro Starter

A modern, opinionated starter template for building fast, accessible, and AI-friendly web applications.

## Tech Stack

- [Astro](https://astro.build/) v5.5.5 - Modern web framework for building fast, content-focused websites
- [React](https://react.dev/) v19.0.0 - UI library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4.0.17 - Utility-first CSS framework

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/przeprogramowani/10x-astro-starter.git
cd 10x-astro-starter
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## API Documentation

This project provides a comprehensive REST API for managing personal finances, including:

- **Starting Balance** - Manage user's starting balance
- **Entry Series** - CRUD operations for one-time and recurring income/expense entries
- **Occurrences** - Retrieve expanded occurrences from entry series with exception handling
- **Projection** - Calculate projected balance for future dates
- **Export** - Export data as CSV

**Base URL:** `/api`

**Authentication:** All endpoints require Supabase JWT token

**Complete API Documentation:** See `.ai/api-plan.md` for detailed endpoint specifications, request/response formats, validation rules, and business logic.

## Project Structure

```md
.
├── src/
│   ├── layouts/           # Astro layouts
│   ├── pages/             # Astro pages
│   │   └── api/           # API endpoints
│   ├── components/        # UI components (Astro & React)
│   ├── lib/
│   │   ├── services/      # Business logic services
│   │   ├── validation/    # Zod validation schemas
│   │   └── utils/         # Utility functions
│   ├── db/                # Supabase client and types
│   └── assets/            # Static assets
├── public/                # Public assets
├── .ai/                   # API documentation and plans
└── supabase/              # Database migrations
```

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

MIT
