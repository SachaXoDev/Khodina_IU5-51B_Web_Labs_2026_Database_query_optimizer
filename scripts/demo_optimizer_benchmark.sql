-- For an isolated demo database only: temporarily dropping an index takes an exclusive table lock.
-- psql "$DATABASE_URL" -v demo_benchmark_confirm=1 -f scripts/demo_optimizer_benchmark.sql
\set ON_ERROR_STOP on
\if :{?demo_benchmark_confirm}
  \if :demo_benchmark_confirm
  \else
    \echo 'Refusing to benchmark: set -v demo_benchmark_confirm=1 for a demo database.'
    \quit
  \endif
\else
  \echo 'Refusing to benchmark: set -v demo_benchmark_confirm=1 for a demo database.'
  \quit
\endif

BEGIN ISOLATION LEVEL REPEATABLE READ;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '60s';

-- Verify that both the index and deterministic data are present before doing DDL.
DO $$
BEGIN
  IF to_regclass('public.idx_database_indexes_status_cardinality_id') IS NULL THEN
    RAISE EXCEPTION 'Expected catalog index not found; start the backend to synchronize the demo schema';
  END IF;
  IF (SELECT count(*) FROM public.database_indexes WHERE status = 'published' AND left(index_name, 14) = 'demo_bench_idx') < 120000 THEN
    RAISE EXCEPTION 'Expected 120,000 published benchmark cards; run demo_optimizer_seed.sql first';
  END IF;
END $$;
ANALYZE public.database_indexes;
ANALYZE public.users;

-- Equivalent to the guest API's page and total queries with minCardinality=420042,
-- limit=24, offset=0. SELECT * abbreviates TypeORM's aliases for the same columns.
\set page_sql 'SELECT i.*, a.* FROM public.database_indexes AS i LEFT JOIN public.users AS a ON a.id = i.author_id WHERE i.status = ''published'' AND i.cardinality = 420042 ORDER BY i.id ASC LIMIT 24 OFFSET 0'
\set total_sql 'SELECT count(*) FROM public.database_indexes AS i WHERE i.status = ''published'' AND i.cardinality = 420042'

\echo 'Warm-up: page and total (exclude from measurements)'
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) :page_sql;
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) :total_sql;

-- psql Time is the wall-clock round trip for EXPLAIN. Report its Planning Time
-- and Execution Time separately; do not interpret the round trip as API latency.
\timing on
\echo 'Run 1: WITH composite B-tree'
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) :page_sql;
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) :total_sql;

SAVEPOINT without_composite;
DROP INDEX public.idx_database_indexes_status_cardinality_id;
\echo 'Run 1: WITHOUT composite B-tree'
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) :page_sql;
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) :total_sql;
ROLLBACK TO SAVEPOINT without_composite;
RELEASE SAVEPOINT without_composite;

\echo 'Run 2: WITH composite B-tree'
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) :page_sql;
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) :total_sql;
SAVEPOINT without_composite;
DROP INDEX public.idx_database_indexes_status_cardinality_id;
\echo 'Run 2: WITHOUT composite B-tree'
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) :page_sql;
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) :total_sql;
ROLLBACK TO SAVEPOINT without_composite;
RELEASE SAVEPOINT without_composite;

\echo 'Run 3: WITH composite B-tree'
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) :page_sql;
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) :total_sql;
SAVEPOINT without_composite;
DROP INDEX public.idx_database_indexes_status_cardinality_id;
\echo 'Run 3: WITHOUT composite B-tree'
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) :page_sql;
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) :total_sql;
ROLLBACK TO SAVEPOINT without_composite;
RELEASE SAVEPOINT without_composite;
\timing off
ROLLBACK;

SELECT to_regclass('public.idx_database_indexes_status_cardinality_id') AS index_restored;
