-- ---------------------------------------------------------------------------
-- Base-table GRANT statements for the blog CMS schema.
--
-- DIAGNOSIS NOTE (why this file exists):
--   The error "permission denied for table posts" / "authors" / "categories"
--   ... even when RLS policies are visible in pg_policies, is caused by the
--   base `GRANT SELECT ... TO anon` privilege being MISSING. Postgres needs
--   TWO things to allow reads under RLS:
--
--     1. `GRANT SELECT ON <table> TO <role>`  —  the privilege to touch the
--                                                table at all.
--     2. A matching `CREATE POLICY … FOR SELECT …` RLS rule  —  WHICH rows.
--
--   Without step 1 you always get 42501 "permission denied for table X"
--   regardless of whether the RLS policy exists.  Migration 0001 creates
--   the RLS policies but relies on Supabase's default template grants for
--   new tables in the `public` schema.  When the project was initialised
--   WITHOUT enabling those template grants (or the tables were created by
--   a role that revoked them), every anon / authenticated / service_role
--   SELECT fails.  Running this migration restores the minimum required
--   privileges without touching any existing data or RLS policies.
--
-- Run in Supabase SQL Editor:
--     paste this file in full  →  Run
-- No-op if grants already present (GRANT statements are idempotent for
-- identical grants in Postgres ≥ 13).
-- ---------------------------------------------------------------------------

begin;

-- ---------------------------------------------------------------------------
-- 1. Public-facing read-only (anon / authenticated).
--
--    Matches the RLS policies in 0001_blog_init.sql:
--      - authors / categories / tags   →  ALL rows readable by anyone.
--      - posts                         →  published rows only (via RLS).
--      - post_tags / post_images       →  only rows that join to a published
--                                         post (via RLS exists-check).
--      - comments                      →  only approved rows on published
--                                         posts (via RLS exists-check) AND
--                                         pending INSERT allowed for
--                                         comment submission.
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on table
    public.authors,
    public.categories,
    public.tags,
    public.posts,
    public.post_tags,
    public.post_images,
    public.comments
to anon, authenticated;

-- Anon users submit new comments via the POST /api/comment endpoint;
-- the RLS "public submits pending comments" policy restricts this to
-- status='pending' + parent-post-is-published.  Without this INSERT
-- grant the CommentSection always fails for real readers.
grant insert (post_id, display_name, body) on table public.comments to anon, authenticated;

-- Allow the API insert to consume the `comments_id_seq` generator so it
-- doesn't fail with "permission denied for sequence comments_id_seq".
grant usage, select on all sequences in schema public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Admin / service-role (used by /admin/** pages and save.ts).
--
--    service_role bypasses RLS by design but STILL needs the base table
--    privilege.  "service_role = bypass RLS" is NOT shorthand for "all
--    grants".  This was the second half of the 42501 bug: both anon AND
--    service_role SELECT were denied.
-- ---------------------------------------------------------------------------

grant all privileges on schema public to service_role;

grant all privileges on table
    public.authors,
    public.categories,
    public.tags,
    public.posts,
    public.post_tags,
    public.post_images,
    public.comments
to service_role;

grant all privileges on all sequences in schema public to service_role;

-- ---------------------------------------------------------------------------
-- 3. Storage read for the "blog-media" bucket so featured images load.
--
--    The public Supabase helper getMediaUrl() builds URLs under
--    /storage/v1/object/public/blog-media/${path} which requires the
--    `storage.objects` table to be selectable AND the bucket to have
--    an RLS policy that allows public reads.  Grants below handle the
--    base-table privilege for objects; bucket-level public policy is
--    in migration 0002_storage.sql.
-- ---------------------------------------------------------------------------

grant select on table storage.objects to anon, authenticated, service_role;
grant insert, update, delete on table storage.objects to service_role;
grant usage, select on all sequences in schema storage to service_role;

commit;
