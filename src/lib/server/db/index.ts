import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { DATABASE_URL } from '$env/static/private';

const databaseUrl = DATABASE_URL || '';

if (!databaseUrl) throw new Error('DATABASE_URL is not set');

const client = postgres(databaseUrl);

export const db = drizzle(client, { schema });
