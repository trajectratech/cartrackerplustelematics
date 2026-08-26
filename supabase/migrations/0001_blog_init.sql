-- Blog CMS schema for Car Tracker Plus Telematics
-- Run once against a Supabase project:
--   Supabase dashboard > SQL Editor > paste this file > Run
-- or with the CLI:
--   supabase db push

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

create type post_status as enum ('draft', 'published', 'archived');
create type comment_status as enum ('pending', 'approved', 'hidden');

create table authors (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	slug text not null unique,
	bio text,
	avatar_path text,
	created_at timestamptz not null default now()
);

create table categories (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	slug text not null unique,
	description text,
	created_at timestamptz not null default now()
);

create table tags (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	slug text not null unique,
	created_at timestamptz not null default now()
);

create table posts (
	id uuid primary key default gen_random_uuid(),
	slug text not null unique,
	title text not null,
	excerpt text not null,
	body text not null,

	status post_status not null default 'draft',
	published_at timestamptz,

	featured_image_path text,
	featured_image_alt text,
	featured_image_width integer,
	featured_image_height integer,
	featured_image_is_placeholder boolean not null default false,

	author_id uuid references authors (id) on delete set null,
	category_id uuid references categories (id) on delete set null,

	meta_title text,
	meta_description text,

	reading_minutes integer not null default 1,

	is_pinned boolean not null default false,
	pin_order integer,

	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),

	constraint featured_image_needs_alt check (
		featured_image_path is null or featured_image_alt is not null
	),
	constraint published_needs_date check (
		status <> 'published' or published_at is not null
	)
);

alter table posts add column search_tsv tsvector
	generated always as (
		setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
		setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
		setweight(to_tsvector('english', coalesce(body, '')), 'C')
	) stored;

create index posts_search_idx on posts using gin (search_tsv);
create index posts_live_idx on posts (status, published_at desc);
create index posts_category_idx on posts (category_id);
create index posts_pinned_idx on posts (is_pinned, pin_order);

create table post_tags (
	post_id uuid not null references posts (id) on delete cascade,
	tag_id uuid not null references tags (id) on delete cascade,
	primary key (post_id, tag_id)
);

create table post_images (
	id uuid primary key default gen_random_uuid(),
	post_id uuid not null references posts (id) on delete cascade,
	path text not null,
	alt text not null,
	width integer,
	height integer,
	position integer not null default 0,
	created_at timestamptz not null default now()
);

create index post_images_post_idx on post_images (post_id, position);

create table comments (
	id uuid primary key default gen_random_uuid(),
	post_id uuid not null references posts (id) on delete cascade,
	display_name text not null,
	body text not null,
	status comment_status not null default 'pending',
	ip_hash text,
	user_agent text,
	created_at timestamptz not null default now(),

	constraint display_name_length check (char_length(display_name) between 2 and 60),
	constraint body_length check (char_length(body) between 2 and 4000)
);

create index comments_post_idx on comments (post_id, status, created_at desc);
create index comments_moderation_idx on comments (status, created_at desc);

create or replace function set_updated_at() returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create trigger posts_set_updated_at
	before update on posts
	for each row execute function set_updated_at();

alter table authors enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table posts enable row level security;
alter table post_tags enable row level security;
alter table post_images enable row level security;
alter table comments enable row level security;

create policy "public reads authors" on authors for select using (true);
create policy "public reads categories" on categories for select using (true);
create policy "public reads tags" on tags for select using (true);

create policy "public reads live posts" on posts
	for select using (status = 'published' and published_at <= now());

create policy "public reads live post tags" on post_tags
	for select using (
		exists (
			select 1 from posts p
			where p.id = post_tags.post_id
			  and p.status = 'published'
			  and p.published_at <= now()
		)
	);

create policy "public reads live post images" on post_images
	for select using (
		exists (
			select 1 from posts p
			where p.id = post_images.post_id
			  and p.status = 'published'
			  and p.published_at <= now()
		)
	);

create policy "public reads approved comments" on comments
	for select using (
		status = 'approved'
		and exists (
			select 1 from posts p
			where p.id = comments.post_id
			  and p.status = 'published'
			  and p.published_at <= now()
		)
	);

create policy "public submits pending comments" on comments
	for insert with check (
		status = 'pending'
		and exists (
			select 1 from posts p
			where p.id = comments.post_id
			  and p.status = 'published'
			  and p.published_at <= now()
		)
	);
