/**
 * Mirrors the SQL generated column on public.exercises:
 *   regexp_replace(lower(name), '[^a-z0-9]', '', 'g')
 * Used by both data layers to resolve "Bench Press" / "benchpress" to one row.
 * Keep in lockstep with migrations/0001_init.sql.
 */
export const normalizeName = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]/g, "");
