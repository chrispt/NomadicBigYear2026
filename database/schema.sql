-- Nomadic Big Year 2026 Database Schema
-- PostgreSQL 12+

-- Drop existing tables/views if they exist
DROP MATERIALIZED VIEW IF EXISTS species_summary CASCADE;
DROP TABLE IF EXISTS geographic_stats CASCADE;
DROP TABLE IF EXISTS monthly_stats CASCADE;
DROP TABLE IF EXISTS observations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    privacy_level VARCHAR(20) DEFAULT 'public' CHECK (privacy_level IN ('public', 'counts_only', 'private')),
    last_login TIMESTAMP,
    magic_link_token VARCHAR(255),
    magic_link_expires TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_magic_token ON users(magic_link_token);

-- Observations table (stores all eBird CSV data)
CREATE TABLE observations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    submission_id VARCHAR(50) NOT NULL,
    common_name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255) NOT NULL,
    taxonomic_order INTEGER,
    count VARCHAR(20),
    state_province VARCHAR(10),
    county VARCHAR(100),
    location_id VARCHAR(50),
    location TEXT,
    latitude FLOAT,
    longitude FLOAT,
    observation_date DATE NOT NULL,
    observation_time TIME,
    protocol VARCHAR(100),
    duration_min INTEGER,
    all_obs_reported BOOLEAN,
    distance_traveled_km FLOAT,
    area_covered_ha FLOAT,
    num_observers INTEGER,
    breeding_code VARCHAR(50),
    observation_details TEXT,
    checklist_comments TEXT,
    ml_catalog_numbers TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, submission_id, scientific_name)
);

CREATE INDEX idx_obs_user_date ON observations(user_id, observation_date);
CREATE INDEX idx_obs_date ON observations(observation_date);
CREATE INDEX idx_obs_submission ON observations(submission_id);
CREATE INDEX idx_obs_species ON observations(scientific_name);
CREATE INDEX idx_obs_state ON observations(state_province);

-- Monthly stats table
CREATE TABLE monthly_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    species_count INTEGER NOT NULL,
    new_species_count INTEGER,
    total_observations INTEGER,
    calculated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, year, month)
);

CREATE INDEX idx_monthly_user_year ON monthly_stats(user_id, year);

-- Geographic stats table
CREATE TABLE geographic_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    state_province VARCHAR(10) NOT NULL,
    county VARCHAR(100),
    species_count INTEGER NOT NULL,
    first_observation DATE,
    last_observation DATE,
    UNIQUE(user_id, state_province, county)
);

CREATE INDEX idx_geo_user ON geographic_stats(user_id);
CREATE INDEX idx_geo_state ON geographic_stats(state_province);

-- Species summary materialized view (for leaderboard)
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
LEFT JOIN observations o ON u.id = o.user_id AND EXTRACT(YEAR FROM o.observation_date) = 2026
GROUP BY u.id, u.name, u.email, u.privacy_level
ORDER BY species_count DESC, last_observation_date DESC;

CREATE UNIQUE INDEX idx_species_summary_user ON species_summary(user_id);

-- Function to refresh species summary
CREATE OR REPLACE FUNCTION refresh_species_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY species_summary;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate monthly stats for a user
CREATE OR REPLACE FUNCTION calculate_monthly_stats(p_user_id INTEGER, p_year INTEGER)
RETURNS void AS $$
BEGIN
    DELETE FROM monthly_stats WHERE user_id = p_user_id AND year = p_year;

    INSERT INTO monthly_stats (user_id, year, month, species_count, total_observations)
    SELECT
        p_user_id,
        p_year,
        EXTRACT(MONTH FROM observation_date)::INTEGER,
        COUNT(DISTINCT scientific_name),
        COUNT(*)
    FROM observations
    WHERE user_id = p_user_id
      AND EXTRACT(YEAR FROM observation_date) = p_year
    GROUP BY EXTRACT(MONTH FROM observation_date)
    ORDER BY EXTRACT(MONTH FROM observation_date);

    -- Calculate new species count (cumulative)
    WITH monthly_cumulative AS (
        SELECT
            month,
            species_count,
            LAG(species_count, 1, 0) OVER (ORDER BY month) AS prev_species_count
        FROM monthly_stats
        WHERE user_id = p_user_id AND year = p_year
        ORDER BY month
    )
    UPDATE monthly_stats ms
    SET new_species_count = mc.species_count - mc.prev_species_count
    FROM monthly_cumulative mc
    WHERE ms.user_id = p_user_id
      AND ms.year = p_year
      AND ms.month = mc.month;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate geographic stats for a user
CREATE OR REPLACE FUNCTION calculate_geographic_stats(p_user_id INTEGER)
RETURNS void AS $$
BEGIN
    DELETE FROM geographic_stats WHERE user_id = p_user_id;

    INSERT INTO geographic_stats (user_id, state_province, county, species_count, first_observation, last_observation)
    SELECT
        p_user_id,
        state_province,
        county,
        COUNT(DISTINCT scientific_name),
        MIN(observation_date),
        MAX(observation_date)
    FROM observations
    WHERE user_id = p_user_id
      AND state_province IS NOT NULL
    GROUP BY state_province, county;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE users IS 'Participant accounts and authentication tokens';
COMMENT ON TABLE observations IS 'All eBird observations imported from CSV files';
COMMENT ON TABLE monthly_stats IS 'Monthly species count progression for progress charts';
COMMENT ON TABLE geographic_stats IS 'Geographic coverage statistics (states/counties visited)';
COMMENT ON MATERIALIZED VIEW species_summary IS 'Leaderboard view with species counts per user';
COMMENT ON FUNCTION refresh_species_summary() IS 'Refresh the species_summary materialized view';
COMMENT ON FUNCTION calculate_monthly_stats(INTEGER, INTEGER) IS 'Recalculate monthly statistics for a user';
COMMENT ON FUNCTION calculate_geographic_stats(INTEGER) IS 'Recalculate geographic statistics for a user';
