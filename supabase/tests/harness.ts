// Runs the Supabase migrations in PGlite (Postgres in WebAssembly) so database
// logic and row-level security can be tested without Docker or a hosted project.
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

// The parts of Supabase's platform schema that our migrations depend on
const SUPABASE_SHIM = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_app_meta_data jsonb not null default '{}',
  raw_user_meta_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant execute on function auth.uid() to anon, authenticated, service_role;

create schema storage;
create table storage.buckets (id text primary key, name text, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text,
  name text, owner uuid, created_at timestamptz default now());
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
$$;
grant usage on schema storage to anon, authenticated, service_role;
grant all on storage.objects to anon, authenticated, service_role;
`;

export type Role = 'admin' | 'exam_officer' | 'teacher' | 'student' | 'parent' | 'applicant';

export interface TestDb {
  db: PGlite;
  /** Run SQL as the given user (row-level security applies), or as superuser when id is null. */
  as<T = Record<string, unknown>>(userId: string | null, sql: string, params?: unknown[]): Promise<T[]>;
  /** Create an auth user; the trigger makes the profile. */
  createUser(role: Role, extra?: { first_name?: string; last_name?: string }): Promise<string>;
}

export async function createTestDb(): Promise<TestDb> {
  const db = new PGlite();
  await db.exec(SUPABASE_SHIM);
  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()) {
    try {
      await db.exec(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'));
    } catch (error) {
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
    }
  }

  const as: TestDb['as'] = async (userId, sql, params = []) => {
    // Each call runs in its own transaction so role and claims never leak between calls
    return db.transaction(async (tx) => {
      if (userId) {
        await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId]);
        await tx.exec('set local role authenticated');
      }
      const result = await tx.query(sql, params);
      return result.rows as never;
    });
  };

  const createUser: TestDb['createUser'] = async (role, extra = {}) => {
    const id = randomUUID();
    await db.query(
      `insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values ($1, $2, $3, $4)`,
      [id, `${role}-${id.slice(0, 8)}@test.local`, { role }, { first_name: extra.first_name ?? role, last_name: extra.last_name ?? 'Test' }],
    );
    return id;
  };

  return { db, as, createUser };
}
