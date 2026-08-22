-- ---------------------------------------------------------------------------
-- Seed the blog CMS (authors / categories / tags / posts / post_tags) with
-- the 3 articles currently hard-coded in src/data/articles.ts so that:
--
--   1. The published content is available immediately via the Supabase
--      `posts` queries in src/lib/posts.ts.
--   2. The dynamic blog routes in src/pages/blogs/ (which call
--      getLivePosts / getLivePostBySlug) resolve to real DB rows instead of
--      falling back to the static articles.ts loader.
--   3. Admins can edit / unpublish / extend content via the `/admin/posts/`
--      editor without needing to redeploy.
--
-- This file is idempotent: every writer uses an `on conflict do nothing` or
-- explicit existence guard, so running it twice (or after the admin has
-- already edited rows) is safe.
--
-- Run it against the CTPT Supabase project:
--     * SQL Editor: paste the whole file > Run
--     * CLI:        supabase db push
--     * psql:       psql $DATABASE_URL -f supabase/migrations/0003_seed_blog_content.sql
-- ---------------------------------------------------------------------------

begin;

-- ---------------------------------------------------------------------------
-- Authors
-- ---------------------------------------------------------------------------

insert into authors (name, slug, bio)
values
(
    'Car Tracker Plus Telematics Editorial Team',
    'ctpt-editorial',
    'Practical telematics, fleet cost, and dashcam risk guides written for Nigerian fleet operators and executive drivers.'
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Categories (one per article.category / first tag). Names match the
-- articles.ts values exactly so the UI shows the same labels whether the
-- page is served from the DB or from the static fallback.
-- ---------------------------------------------------------------------------

insert into categories (name, slug, description)
values
(
    'Telematics & Premium Tracking',
    'telematics-premium-tracking',
    'Premium GPS tracking and telematics best practice for executive and high-value vehicles.'
),
(
    'Fleet Management Economics',
    'fleet-management-economics',
    'Fleet cost reduction, fuel accountability, and ROI analysis for commercial fleets.'
),
(
    'Dashcam & Risk Management',
    'dashcam-risk-management',
    'Dashcam value, incident evidence, claims protection and fleet safety guidance.'
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Tags (union of every articles[*].tags value, slugified with the same
-- whitespace / casing rules as slugify() in src/lib/posts.ts).
-- ---------------------------------------------------------------------------

insert into tags (name, slug)
values
    ('Premium Tracking',    'premium-tracking'),
    ('Executive Vehicles',  'executive-vehicles'),
    ('Telematics',          'telematics'),
    ('Installation Quality','installation-quality'),
    ('Nigeria',             'nigeria'),
    ('Fleet Management',    'fleet-management'),
    ('Cost Reduction',      'cost-reduction'),
    ('Fuel Monitoring',     'fuel-monitoring'),
    ('Telematics ROI',      'telematics-roi'),
    ('Driver Accountability','driver-accountability'),
    ('Dashcams',            'dashcams'),
    ('Risk Management',     'risk-management'),
    ('Claims Protection',   'claims-protection'),
    ('Incident Evidence',   'incident-evidence'),
    ('Fleet Safety',        'fleet-safety')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Posts.
--
-- Featured images reference the existing logo placeholder used by the
-- static renderer. Width/height match the 1080x589 values in articles.ts
-- (rounded up slightly to 1200x630 for social-card preview compatibility,
-- which is what the static converter also produced).
--
-- Meta title is generated from the same rule getBlogPostSeo() uses:
--     "<title> | Car Tracker Plus Telematics"
-- because the current SEO helper falls back to this pattern when the DB
-- meta_title column is non-null, otherwise it assembles from post.title.
-- Storing an explicit meta_* value means admins can tweak it later.
-- ---------------------------------------------------------------------------

with author_id_cte(author_id) as (
    select id from authors where slug = 'ctpt-editorial' limit 1
),
article_1(cat_slug) as (values ('telematics-premium-tracking')),
article_2(cat_slug) as (values ('fleet-management-economics')),
article_3(cat_slug) as (values ('dashcam-risk-management'))

insert into posts
(
    slug,
    title,
    excerpt,
    body,
    status,
    published_at,
    featured_image_path,
    featured_image_alt,
    featured_image_width,
    featured_image_height,
    featured_image_is_placeholder,
    author_id,
    category_id,
    meta_title,
    meta_description,
    reading_minutes,
    is_pinned,
    pin_order
)
select
    'vehicle-tracking-best-practices-for-premium-fleets',
    'Vehicle Tracking Best Practices for Premium Fleets and Executive Vehicles',
    'Premium vehicle tracking works best when it is designed around executive protection, fleet visibility, and disciplined operations — not just a dot on a map.',
    $body_1$
## Start with what the tracking platform actually needs to protect

For premium vehicles and executive fleets, tracking success is usually measured by very different outcomes than a consumer tracker. Executives need discretion, fleet managers need operational oversight, and every stakeholder needs confidence that the platform will work reliably when the moment matters.

The right setup begins with the real use cases: executive route discretion, driver behaviour visibility, after-hours movement alerts, fuel controls, and whether dashcam footage needs to be available for incident review.

## What a premium telematics setup should actually deliver

A premium tracking platform should provide clean visibility without overwhelming the user. The most useful systems are the ones that executives and fleet supervisors actually open consistently — not the ones with the longest feature list.

- Real-time location and dependable trip history
- Ignition alerts and after-hours movement notifications
- Geofencing around homes, offices, and restricted routes
- Professional concealed installation that preserves vehicle aesthetics
- Remote immobilisation where the vehicle and installation support it
- Driver behaviour insights including speed, idling, and harsh events

## Why installation discipline matters even more for premium vehicles

In executive vehicles, a sloppy installation is not only a reliability problem. It is also a discretion problem. Visible wiring, bulky devices, and rushed placement undermine the whole point of a professional tracking system.

That is why installation quality should be treated as a first-class requirement, not an afterthought. The best hardware in the world loses most of its value if the installation makes it easy to detect, easy to disable, or awkward to live with every day.

## Pair tracking with the right supporting stack

Many premium fleets benefit from more than GPS visibility alone. Dashcam integration, fuel-level monitoring, speed controls, and multi-vehicle fleet reporting can turn a basic tracker into a proper telematics operation.

The right combination depends on whether the priority is executive security, fleet cost control, claims protection, or accountability across a larger vehicle pool.
$body_1$,
    'published'::post_status,
    '2026-08-01 09:00:00+01:00'::timestamptz,
    'cartracker-plus-telematics-logo.webp',
    'Premium vehicle tracking and telematics dashboard used by Car Tracker Plus Telematics',
    1200::integer,
    630::integer,
    true::boolean,
    a.author_id,
    (select id from categories where slug = (select cat_slug from article_1) limit 1),
    'Vehicle Tracking Best Practices for Premium Fleets and Executive Vehicles | Car Tracker Plus Telematics',
    'Learn premium vehicle tracking best practices for executive security, fleet telematics, driver accountability, fuel monitoring, and dashcam integration in Nigeria.',
    6::integer,
    false::boolean,
    null::integer
from author_id_cte a

union all

select
    'fleet-management-cost-reduction-with-telematics',
    'Fleet Management Cost Reduction: How Telematics Actually Lowers Operating Spend',
    'Most fleet cost reduction is not about dramatic cuts. It is about replacing guesswork with the kind of visibility that makes waste visible every single day.',
    $body_2$
## Why fleet spend drifts upwards without telematics

Most fleets do not lose money on one big problem. They lose it on a hundred small ones that nobody notices individually: vehicles idling too long, drivers taking longer routes, fuel that cannot be accounted for, harsh braking that shortens brake life, and speeds that raise both risk and consumption.

Fleet telematics does not save money by itself. It saves money by making those patterns visible quickly enough that managers can address them before they become normal operating cost.

## Where telematics typically creates the biggest savings

Every fleet is different, but the largest savings usually come from a small number of operational improvements that are easy to address once they can actually be measured.

- Fuel accountability through level monitoring and refill visibility
- Reduced idle time and better route discipline
- Lower speed-related consumption and fewer risk events
- Maintenance awareness driven by actual use rather than rough schedules
- Clearer driver accountability for vehicle handling

## Fuel monitoring is usually the fastest win

For many fleets in Nigeria, fuel is the single biggest operating line item and the hardest one to verify with paper records. A good telematics stack pairs GPS movement with fuel-level trends, so that managers can compare distance travelled against consumption, not just against receipts.

This is where the return on investment becomes clearest. Even a modest improvement in fuel accountability usually pays for the telematics setup quickly.

## How to get adoption without friction

A telematics rollout works best when drivers understand that the system is for operational support, safety, and accountability — not surveillance for its own sake.

Teams that position the platform clearly, train supervisors to review the same metrics consistently, and act on data rather than assumptions tend to see much faster cost improvements than teams that install quietly and react only after problems.
$body_2$,
    'published'::post_status,
    '2026-08-05 09:00:00+01:00'::timestamptz,
    'cartracker-plus-telematics-logo.webp',
    'Fleet telematics dashboard showing operating costs and vehicle visibility',
    1200::integer,
    630::integer,
    true::boolean,
    a.author_id,
    (select id from categories where slug = (select cat_slug from article_2) limit 1),
    'Fleet Management Cost Reduction: How Telematics Actually Lowers Operating Spend | Car Tracker Plus Telematics',
    'Understand how fleet telematics reduces operating costs through fuel accountability, route discipline, idle reduction, speed controls and maintenance visibility.',
    7::integer,
    false::boolean,
    null::integer
from author_id_cte a

union all

select
    'dashcam-investment-value-for-commercial-and-executive-fleets',
    'Dashcam Investment Value: Why Commercial and Executive Fleets Are Prioritising Dashcam Systems',
    'For commercial and executive fleets, a dashcam is not a recording accessory. It is the fastest way to reduce uncertainty after an incident.',
    $body_3$
## Dashcams pay for themselves by removing uncertainty

Every fleet operator understands the feeling: an incident happens, the story is unclear, and without footage the business is exposed to whatever version of events the other parties choose to tell.

A good dashcam setup does not prevent incidents. But it dramatically reduces the time, cost, and stress of understanding what actually happened — and that is where most of the business value lives.

## Where dashcams create measurable value for fleets

The value is not only in major collisions. Dashcams create value across the whole operating cycle: disputed incidents, near-miss coaching, false claims, and understanding whether the driving team is following the standards the business expects.

- Footage for incident review and claims handling
- Stronger position when a report is disputed or exaggerated
- Clearer driver accountability and coaching support
- Better incident decisions from operations and management teams

## Dashcams work even better alongside telematics

Footage alone is useful. Footage combined with GPS location, speed, ignition timing and trip history is dramatically more useful. Together, telematics and dashcams create a complete story rather than a disconnected fragment.

This is why many premium fleets now install dashcams as part of a broader telematics package rather than as a standalone purchase. The combined view is what gives managers real confidence in a review.

## Choose reliability, installation quality and retrieval simplicity

For commercial and executive use, the worst dashcam is the one that fails to record, is mounted badly, or cannot retrieve footage quickly when it matters. A cheaper setup with weak installation often ends up costing far more than it saved on the day the footage is actually needed.

The right choice is a dependable system, installed professionally, with straightforward retrieval and support that fits the real operating environment of the fleet.
$body_3$,
    'published'::post_status,
    '2026-08-10 09:00:00+01:00'::timestamptz,
    'cartracker-plus-telematics-logo.webp',
    'Dashcam system integrated with fleet telematics for commercial and executive vehicles',
    1200::integer,
    630::integer,
    true::boolean,
    a.author_id,
    (select id from categories where slug = (select cat_slug from article_3) limit 1),
    'Dashcam Investment Value: Why Commercial and Executive Fleets Are Prioritising Dashcam Systems | Car Tracker Plus Telematics',
    'Understand the real value of dashcams for commercial and executive fleets: incident evidence, driver accountability, claims support, and protection against false reports.',
    6::integer,
    false::boolean,
    null::integer
from author_id_cte a

on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Post / tag links.
--
-- Each article maps to its articles[*].tags list exactly so the "tag cloud"
-- behaviour (and any future tag-page readers) produce identical output to
-- the static site-articles fallback.
-- ---------------------------------------------------------------------------

insert into post_tags (post_id, tag_id)
select p.id, t.id
from posts p
cross join lateral (
    select tag_slug::text
    from unnest(
        case p.slug
            when 'vehicle-tracking-best-practices-for-premium-fleets' then
                array['premium-tracking','executive-vehicles','telematics','installation-quality','nigeria']
            when 'fleet-management-cost-reduction-with-telematics' then
                array['fleet-management','cost-reduction','fuel-monitoring','telematics-roi','driver-accountability']
            when 'dashcam-investment-value-for-commercial-and-executive-fleets' then
                array['dashcams','risk-management','claims-protection','incident-evidence','fleet-safety']
        end
    ) as x(tag_slug)
) tag_lookup
join tags t on t.slug = tag_lookup.tag_slug
on conflict (post_id, tag_id) do nothing;

commit;
