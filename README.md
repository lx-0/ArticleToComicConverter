# Article to Comic Converter

Transform any article into a visually stunning comic using AI. This web application takes article URLs as input and generates a sequence of comic panels that tell the story in a visual format.

## [🔗 Try the Demo](https://comic-converter.replit.app)

## Features

- Convert articles into comic panels using AI
- Customizable number of panels
- Advanced prompt customization options
- Automatic image generation and storage
- Share generated comics via unique links
- Recent comics gallery
- Progress tracking for comic generation
- Collapsible interface components

## Tech Stack

- Frontend: React with TypeScript
- Backend: Express.js
- Database: PostgreSQL with Drizzle ORM
- AI Integration: OpenAI GPT-4 and DALL-E 3
- Styling: Tailwind CSS with shadcn/ui components
- Routing: Wouter
- State Management: TanStack Query

## Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key

## Environment Variables

```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_postgres_connection_string
PGHOST=your_postgres_host
PGPORT=your_postgres_port
PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
PGDATABASE=your_postgres_database
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables
4. Run database migrations:
   ```bash
   npm run db:push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Visit the web application
2. Enter an article URL
3. Choose the number of comic panels (1-10)
4. Optionally customize generation prompts
5. Click "Generate Comic"
6. Wait for the generation process to complete
7. View and share your generated comic

## Project Structure

- `/client` - Frontend React application
- `/server` - Express.js backend
- `/db` - Database schema and migrations
- `/public` - Static assets
- `/server/services` - Core services (OpenAI, scraping, comic generation)

## License

MIT
