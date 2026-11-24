-- Run once the Nest backend has initialized the schema and demo users.
-- psql "$DATABASE_URL" -v demo_seed_confirm=1 -f scripts/demo_optimizer_seed.sql
\set ON_ERROR_STOP on
\if :{?demo_seed_confirm}
  \if :demo_seed_confirm
  \else
    \echo 'Refusing to seed: set -v demo_seed_confirm=1 for a demo database.'
    \quit
  \endif
\else
  \echo 'Refusing to seed: set -v demo_seed_confirm=1 for a demo database.'
  \quit
\endif

BEGIN;
SET LOCAL search_path = public, pg_catalog;
SELECT pg_advisory_xact_lock(602626, 1);

-- A stable reserved namespace and a transaction lock make repeat runs additive/idempotent.
-- Data only: this script does not delete, truncate, or update existing rows.
WITH candidates(n, index_name, table_name, index_type, column_name, cardinality) AS (
  SELECT n, format('demo_bench_idx_%s', lpad(n::text, 6, '0')),
         'bench_relation_' || (n % 40),
         (ARRAY['B-Tree','BRIN','Hash','GIN','GiST'])[1 + (n % 5)],
         (ARRAY['customer_id','created_at','sku','payload','region'])[1 + (n % 5)],
         CASE WHEN n % 160 = 0 THEN 420042 ELSE 1000 + (n % 4000) * 500 END
  FROM generate_series(1, 120000) AS n
)
INSERT INTO public.database_indexes (
  index_name, short_description, table_name, index_type, column_name, cardinality,
  full_description, image_url, video_url, status, author_id,
  created_at, published_at
)
SELECT index_name, format('Benchmark row %s', n),
       table_name, index_type, column_name, cardinality,
       'Generated data for the PostgreSQL equality-and-ordering experiment.',
       '/assets/default_index.svg', '/assets/default_video.mp4',
       'published', (SELECT id FROM public.users WHERE username = 'pg_expert'),
       timestamp '2026-01-01 12:00:00', timestamp '2026-01-01 12:00:00'
FROM candidates AS c
WHERE NOT EXISTS (SELECT 1 FROM public.database_indexes AS i WHERE i.index_name = c.index_name)
ORDER BY n;

-- Four have local image fixtures for calibration. All fourteen descriptions are
-- English CLIP candidates under the same rules as ordinary published cards.
WITH curated(n, slug, description, table_name, index_type, column_name, cardinality, image) AS (
  VALUES
    (1, 'florist_colors', 'A florist arranges bright bouquets of pink tulips and yellow roses in glass vases.', 'flower_orders', 'B-Tree', 'flower_color', 10500, NULL),
    (2, 'mountain_trails', 'Hikers follow a winding rocky trail above a green valley and snowy mountain peaks.', 'trail_segments', 'GiST', 'geometry', 23500, NULL),
    (3, 'bicycle_shop', 'A mechanic repairs the wheel of a blue bicycle in a workshop lined with tools.', 'bike_repairs', 'Hash', 'work_order', 36000, NULL),
    (4, 'library_catalog', 'A reader browses tall wooden shelves filled with books in a quiet public library.', 'library_books', 'GIN', 'search_document', 62500, NULL),
    (5, 'bakery_orders', 'A baker slides a tray of fresh croissants out of the oven in a small bakery kitchen.', 'bakery_orders', 'BRIN', 'baked_at', 92500, NULL),
    (6, 'harbor_arrivals', 'Fishing boats are moored along a harbor beside colorful containers and dock cranes.', 'harbor_visits', 'BRIN', 'arrival_date', 154000, NULL),
    (7, 'animal_shelter', 'A brown dog with a red collar waits beside a wire gate at an animal shelter.', 'shelter_animals', 'B-Tree', 'animal_species', 16500, NULL),
    (8, 'school_garden', 'Children water rows of seedlings in a sunny school garden with raised wooden beds.', 'garden_plots', 'GiST', 'coordinates', 18500, NULL),
    (9, 'coffee_roaster', 'A barista pours steamed milk into an espresso cup while a coffee roaster turns nearby.', 'coffee_orders', 'Hash', 'receipt_number', 43800, NULL),
    (10, 'night_train', 'A passenger carrying a suitcase walks toward an illuminated train at night.', 'train_departures', 'B-Tree', 'departure_time', 52700, NULL),
    (11, 'card_cabinet', 'A wooden library card catalog cabinet with rows of labeled drawers and metal handles.', 'library_cards', 'B-Tree', 'label', 12500, '/media/index_users_email.jpg'),
    (12, 'digital_rain', 'Bright green letters and numbers stream vertically down a black screen like digital rain.', 'screen_events', 'Hash', 'event_code', 24000, '/media/index_products_sku.jpg'),
    (13, 'server_racks', 'Black server racks with colorful network cables and status lights in a dark data center.', 'server_inventory', 'B-Tree', 'rack_id', 31000, '/media/index_orders_created_at.jpg'),
    (14, 'circuit_board', 'A close-up of a computer circuit board with black chips, capacitors, and fine traces.', 'components', 'B-Tree', 'part_number', 54700, '/media/index_logs_timestamp.jpg')
)
INSERT INTO public.database_indexes (
  index_name, short_description, table_name, index_type, column_name, cardinality,
  full_description, image_url, video_url, status, author_id,
  created_at, published_at
)
SELECT 'demo_clip_' || slug, description, table_name, index_type, column_name, cardinality,
       format('Curated semantic example. The %s index supports queries on %s.%s.', index_type, table_name, column_name),
       coalesce(image, '/assets/default_index.svg'), '/assets/default_video.mp4',
       'published', (SELECT id FROM public.users WHERE username = 'pg_expert'),
       timestamp '2026-01-01 12:00:00', timestamp '2026-01-01 12:00:00'
FROM curated AS c
WHERE NOT EXISTS (SELECT 1 FROM public.database_indexes AS i WHERE i.index_name = 'demo_clip_' || c.slug)
ORDER BY n;

COMMIT;
ANALYZE public.database_indexes;

SELECT count(*) FILTER (WHERE left(index_name, 14) = 'demo_bench_idx') AS benchmark_cards,
       count(*) FILTER (WHERE cardinality = 420042) AS matching_cardinality,
       count(DISTINCT cardinality) AS different_cardinalities,
       count(*) FILTER (WHERE left(index_name, 10) = 'demo_clip_' AND char_length(short_description) BETWEEN 50 AND 100) AS curated_cards
FROM public.database_indexes
WHERE status = 'published';
