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
    'Down-to-earth advice on GPS security, fleet expense control, and dashboard camera systems, curated specifically for Nigerian business owners and luxury vehicle managers.'
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
    'Advanced GPS & Vehicle Security',
    'telematics-premium-tracking',
    'Cutting-edge location monitoring and vehicle protection strategies for high-value automobiles and executive transport.'
),
(
    'Fleet Expense & Operational Efficiency',
    'fleet-management-economics',
    'Strategies for lowering fleet running costs, improving fuel stewardship, and measuring return on telematics investments.'
),
(
    'Dashcam Deployment & Incident Protection',
    'dashcam-risk-management',
    'Practical guidance on dashcam selection, installation quality, incident documentation, and fleet accident mitigation.'
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Tags (union of every articles[*].tags value, slugified with the same
-- whitespace / casing rules as slugify() in src/lib/posts.ts).
-- ---------------------------------------------------------------------------

insert into tags (name, slug)
values
    ('High-End GPS Tracking',    'premium-tracking'),
    ('Luxury Auto Fleet',  'executive-vehicles'),
    ('Connected Vehicle Tech',          'telematics'),
    ('Expert Installation','installation-quality'),
    ('Nigerian Roads',             'nigeria'),
    ('Fleet Operational Oversight',    'fleet-management'),
    ('Operational Savings',      'cost-reduction'),
    ('Fuel Level Sensors',     'fuel-monitoring'),
    ('Telematics Payoff',      'telematics-roi'),
    ('Driver Performance','driver-accountability'),
    ('Vehicle Cameras',            'dashcams'),
    ('Operational Risk Mitigation',     'risk-management'),
    ('Insurance Claim Defense',   'claims-protection'),
    ('Accident Proof',   'incident-evidence'),
    ('Driver Protection',        'fleet-safety')
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
    'Proven GPS Tracking Strategies for Luxury Fleets and Executive Transport',
    'Top-tier vehicle monitoring delivers the most value when it is built around confidentiality requirements, fleet transparency, and consistent operational discipline — not a simple map pin.',
    $body_1$
## Begin by defining what your security platform must actually safeguard

For luxury automobiles and executive transport operations, tracking effectiveness is judged by standards that rarely apply to consumer-grade devices. Executives demand discretion, fleet controllers demand operational clarity, and everyone involved needs assurance that the system performs reliably when circumstances demand it.

The optimal configuration grows directly from genuine operational needs: route discretion for VIP passengers, driver conduct visibility, off-hours unauthorised motion warnings, fuel management controls, and whether dashboard camera recordings should be accessible for post-incident examination.

## Core capabilities a high-grade telematics configuration should provide

A premium tracking solution should deliver crisp situational awareness without cognitive overload. The most effective deployments are the ones that executives and fleet supervisors actually consult on a routine basis — not installations boasting the longest possible feature checklist.

- Live position updates plus dependable historical trip archives
- Engine status notifications and off-hours relocation warnings
- Geofenced perimeters around private residences, corporate campuses, and restricted travel corridors
- Discreet professional installation that respects vehicle interior aesthetics
- Remote disabling functionality where the vehicle model and installation method permit
- Driver conduct analytics covering velocity, idle periods, and aggressive manoeuvring

## Why installation craftsmanship matters disproportionately for premium vehicles

Within executive vehicles, a hasty installation represents more than a dependability concern. It also constitutes a confidentiality concern. Exposed cabling, awkwardly positioned hardware, and rushed placement undermine the entire premise of a professionally specified protection system.

Installation workmanship must therefore be treated as a principal requirement rather than a secondary concern. Even the most capable tracking hardware surrenders the majority of its value if the physical installation renders it simple to discover, simple to neutralise, or inconvenient to tolerate on a daily basis.

## Augment location tracking with complementary supporting technologies

Many high-value fleet operations benefit from capabilities beyond GPS positioning alone. Dashboard camera integration, fuel-level telemetry, velocity governors, and consolidated multi-vehicle reporting can elevate a basic tracking installation into a fully-fledged telematics operation.

The optimal configuration blend depends on whether the overriding priority is executive personal security, fleet expenditure governance, insurance claim defence, or conduct accountability across a more extensive vehicle pool.
$body_1$,
    'published'::post_status,
    '2026-08-01 09:00:00+01:00'::timestamptz,
    'cartracker-plus-telematics-logo.webp',
    'Luxury vehicle GPS security dashboard and telematics monitoring interface from Car Tracker Plus Telematics',
    1200::integer,
    630::integer,
    true::boolean,
    a.author_id,
    (select id from categories where slug = (select cat_slug from article_1) limit 1),
    'Proven GPS Tracking Strategies for Luxury Fleets and Executive Transport | Car Tracker Plus Telematics',
    'Discover high-grade vehicle GPS tracking methods for executive confidentiality, fleet telematics oversight, driver performance, fuel stewardship, and dashcam deployment across Nigeria.',
    6::integer,
    false::boolean,
    null::integer
from author_id_cte a

union all

select
    'fleet-management-cost-reduction-with-telematics',
    'Fleet Budget Optimisation: How Telematics Systems Actually Trim Operational Expenses',
    'The majority of fleet budget savings result not from dramatic one-off reductions, but from replacing assumption-based decisions with the granular visibility that reveals routine waste patterns.',
    $body_2$
## Why fleet expenditure gradually escalates without telematics oversight

Most fleet operations do not haemorrhage budget through a single catastrophic failure point. Resources erode through dozens of minor oversights that individually escape attention: vehicles idling excessively, drivers selecting suboptimal routes, fuel volumes that cannot be reconciled, harsh braking that accelerates component wear, and travel speeds that inflate both hazard exposure and consumption rates.

Fleet telematics does not automatically reduce expenditure. It reduces expenditure by rendering these recurring patterns visible quickly enough that supervisors can intervene before they solidify into accepted baseline operating cost.

## Operational domains where telematics typically delivers the largest savings

Every fleet possesses unique characteristics, but the most substantial savings typically emerge from a narrow set of behavioural refinements that become straightforward to address once they can be reliably measured.

- Fuel stewardship via tank level telemetry and refill event verification
- Curtailed idle duration and improved routing discipline
- Reduced velocity-linked consumption and fewer hazard events
- Maintenance awareness driven by actual utilisation patterns rather than approximate schedules
- Clearer driver responsibility for vehicle treatment standards

## Fuel monitoring typically delivers the most immediate return on investment

For numerous Nigerian fleet operations, fuel represents the single largest recurring expenditure line and the most challenging item to verify through paper-based records alone. A properly integrated telematics solution correlates GPS travel patterns against tank level fluctuations, enabling supervisors to reconcile distance travelled against actual consumption rather than receipts alone.

This is precisely where investment returns become most unambiguous. Even a moderate uplift in fuel stewardship typically covers the complete telematics deployment cost within a remarkably short timeframe.

## How to secure team adoption without introducing unnecessary friction

A telematics rollout delivers the strongest results when drivers perceive the system as supporting operational safety, fairness, and accountability — rather than surveillance implemented for its own sake.

Teams that communicate the purpose of the platform transparently, train supervisors to review consistent metrics on a regular cadence, and respond to data insights rather than anecdotal assumptions consistently achieve substantially faster cost improvements than teams that deploy technology discreetly and react exclusively after problems surface.
$body_2$,
    'published'::post_status,
    '2026-08-05 09:00:00+01:00'::timestamptz,
    'cartracker-plus-telematics-logo.webp',
    'Fleet operations analytics console displaying expenditure trends and comprehensive vehicle visibility',
    1200::integer,
    630::integer,
    true::boolean,
    a.author_id,
    (select id from categories where slug = (select cat_slug from article_2) limit 1),
    'Fleet Budget Optimisation: How Telematics Systems Actually Trim Operational Expenses | Car Tracker Plus Telematics',
    'Explore how fleet telematics technology reduces operational expenditure through improved fuel accountability, routing efficiency, idle reduction, speed governance, and proactive maintenance visibility.',
    7::integer,
    false::boolean,
    null::integer
from author_id_cte a

union all

select
    'dashcam-investment-value-for-commercial-and-executive-fleets',
    'Dashcam Deployment Rationale: Why Commercial and Executive Fleets Are Accelerating Camera System Rollouts',
    'For commercial transport operations and executive vehicle fleets, a dashcam represents far more than a recording accessory. It represents the most efficient mechanism available for eliminating ambiguity following unexpected events.',
    $body_3$
## Dashcams generate returns by eliminating ambiguity from incident resolution

Every fleet manager recognises the characteristic uncertainty: a reportable event occurs, available accounts conflict, and without contemporaneous footage the organisation remains exposed to whatever narrative version opposing parties elect to present.

A properly specified dashcam system does not prevent incidents from occurring. However, it dramatically compresses the time, expense, and emotional burden required to understand exactly what transpired — and that capability is where the overwhelming majority of its business value resides.

## Specific operational domains where dashcams deliver measurable fleet value

The measurable returns extend well beyond significant collision scenarios. Dashcams generate value throughout the complete operational lifecycle: contested liability situations, coaching interventions following near-miss observations, exaggerated or fabricated claims, and verifying whether driving teams consistently uphold the operational standards the organisation requires.

- Neutral footage for incident reconstruction and claim administration
- Strengthened negotiating position when an account becomes contested or embellished
- Improved driver responsibility frameworks and structured coaching opportunities
- Better-informed decision-making from operations and management personnel

## Dashcam capabilities compound significantly when integrated alongside telematics data

Recorded footage in isolation delivers substantial utility. Footage correlated with GPS positioning, travel velocity, ignition sequencing, and complete trip history delivers exponentially greater utility. In combination, telematics data and dashcam recordings construct a coherent chronological narrative rather than an isolated and potentially misleading fragment.

This precisely explains why numerous premium fleet operations now specify dashcams as an integrated component within a broader telematics procurement rather than as an independent standalone purchase. It is the consolidated perspective that grants supervisors genuine confidence during retrospective reviews.

## Prioritise hardware dependability, installation craftsmanship, and straightforward footage retrieval

For commercial and executive transport applications, the most disappointing dashcam is the unit that fails to capture footage due to inadequate power connections, suffers from poor mounting placement, or requires excessively convoluted procedures to retrieve recordings when they become critically necessary. An initially less expensive deployment combined with substandard installation work frequently proves vastly more expensive in aggregate on the specific day that footage becomes operationally indispensable.

The correct procurement decision is a dependable recording ecosystem, installed by certified specialists, with uncomplicated retrieval workflows and responsive technical support calibrated to the actual operating environment of your specific fleet.
$body_3$,
    'published'::post_status,
    '2026-08-10 09:00:00+01:00'::timestamptz,
    'cartracker-plus-telematics-logo.webp',
    'Dashboard camera hardware seamlessly integrated with fleet telematics for commercial and luxury vehicle applications',
    1200::integer,
    630::integer,
    true::boolean,
    a.author_id,
    (select id from categories where slug = (select cat_slug from article_3) limit 1),
    'Dashcam Deployment Rationale: Why Commercial and Executive Fleets Are Accelerating Camera System Rollouts | Car Tracker Plus Telematics',
    'Explore the genuine operational value of dashcam systems for commercial and executive fleets: neutral incident documentation, driver accountability, claims assistance, and defence against fabricated reports.',
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
