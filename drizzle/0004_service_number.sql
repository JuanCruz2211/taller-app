-- Add per-workshop sequential service number
ALTER TABLE "service_records" ADD COLUMN "service_number" integer;

-- Backfill existing records with per-workshop sequential numbers
WITH numbered AS (
  SELECT
    id,
    workshop_id,
    ROW_NUMBER() OVER (
      PARTITION BY workshop_id
      ORDER BY created_at, id
    ) AS seq
  FROM service_records
)
UPDATE service_records
SET service_number = numbered.seq
FROM numbered
WHERE service_records.id = numbered.id;

-- Make it NOT NULL now that all records have a value
ALTER TABLE "service_records" ALTER COLUMN "service_number" SET NOT NULL;
