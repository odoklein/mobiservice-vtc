// Only initialize database on server-side
// Client-side code should not import this directly
let dbInstance: any = null;

if (typeof window === 'undefined') {
  // Server-side only - dynamic imports to avoid client-side execution
  const { drizzle } = require('drizzle-orm/neon-http');
  const { neon } = require('@neondatabase/serverless');
  const schema = require('./schema');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = neon(process.env.DATABASE_URL);
  dbInstance = drizzle(sql, { schema });
} else {
  // Client-side: set to null (will cause errors if used, which is intentional)
  // Client code should use API routes instead of direct database access
  dbInstance = null;
}

export const db = dbInstance;
