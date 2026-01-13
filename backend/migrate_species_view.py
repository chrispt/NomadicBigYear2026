"""
One-time migration to update species_summary view with countable species filter.
Run this script once after deployment to update the materialized view.

Usage: python migrate_species_view.py
"""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL)

migration_sql = """
DROP MATERIALIZED VIEW IF EXISTS species_summary CASCADE;

CREATE MATERIALIZED VIEW species_summary AS
SELECT
    u.id AS user_id,
    u.name AS user_name,
    u.email AS user_email,
    u.privacy_level,
    COUNT(DISTINCT o.scientific_name) AS species_count,
    MAX(o.observation_date) AS last_observation_date,
    MAX(o.uploaded_at) AS last_upload_date
FROM users u
LEFT JOIN observations o ON u.id = o.user_id
    AND EXTRACT(YEAR FROM o.observation_date) = 2026
    AND o.common_name NOT LIKE '%(Domestic%'
    AND o.common_name NOT LIKE '%hybrid%'
    AND o.common_name NOT LIKE '% x %'
    AND o.common_name NOT LIKE '%/%'
    AND o.common_name NOT LIKE '%sp.%'
GROUP BY u.id, u.name, u.email, u.privacy_level
ORDER BY species_count DESC, last_observation_date DESC;

CREATE UNIQUE INDEX idx_species_summary_user ON species_summary(user_id);
"""

if __name__ == "__main__":
    print("Updating species_summary materialized view...")
    with engine.connect() as conn:
        conn.execute(text(migration_sql))
        conn.commit()

        # Verify
        result = conn.execute(text("SELECT user_name, species_count FROM species_summary;"))
        print("\nUpdated species counts:")
        for row in result:
            print(f"  {row[0]}: {row[1]} species")

    print("\nMigration complete!")
