-- Migration: Fix schema column names based on GitHub repo analysis
-- Removes incorrect columns and adds missing ones

-- ============================================
-- 1. RIKSDAGEN_LEDAMOTER (Members of Parliament)
-- ============================================

-- Remove incorrect column 'fornamn' (doesn't exist in API)
ALTER TABLE riksdagen_ledamoter
DROP COLUMN IF EXISTS fornamn;

-- Ensure correct columns exist
-- tilltalsnamn, efternamn, parti, kon, fodd_ar, valkrets should already exist


-- ============================================
-- 2. RIKSDAGEN_ANFORANDEN (Speeches)
-- ============================================

-- Remove incorrect columns
ALTER TABLE riksdagen_anforanden
DROP COLUMN IF EXISTS debattnamn,
DROP COLUMN IF EXISTS anftext,
DROP COLUMN IF EXISTS anfdatum;

-- Add missing column 'replik' (reply/rebuttal)
ALTER TABLE riksdagen_anforanden
ADD COLUMN IF NOT EXISTS replik TEXT;

-- Ensure correct columns exist:
-- avsnittsrubrik, anforandetext, dok_datum, systemdatum, talare, parti


-- ============================================
-- 3. RIKSDAGEN_VOTERINGAR (Votings)
-- ============================================

-- Remove incorrect columns
ALTER TABLE riksdagen_voteringar
DROP COLUMN IF EXISTS titel,
DROP COLUMN IF EXISTS votering_datum;

-- Add voting result columns (Ja, Nej, Avstår, Frånvarande)
ALTER TABLE riksdagen_voteringar
ADD COLUMN IF NOT EXISTS ja_roster INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nej_roster INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avstar_roster INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS franvarande_roster INTEGER DEFAULT 0;

-- Add comment to beteckning column (this is what should be used for search)
COMMENT ON COLUMN riksdagen_voteringar.beteckning IS 'Voting designation - use this instead of titel';

-- Ensure correct columns exist:
-- beteckning, systemdatum, rm


-- ============================================
-- 4. RIKSDAGEN_DOKUMENT (Documents)
-- ============================================

-- Ensure doktyp is lowercase for consistency
-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_dokument_doktyp_lower ON riksdagen_dokument (LOWER(doktyp));
CREATE INDEX IF NOT EXISTS idx_dokument_rm ON riksdagen_dokument (rm);
CREATE INDEX IF NOT EXISTS idx_dokument_datum ON riksdagen_dokument (datum);

-- Add comment
COMMENT ON COLUMN riksdagen_dokument.doktyp IS 'Document type - stored in lowercase (mot, prop, bet, etc.)';


-- ============================================
-- 5. CREATE PARTY ALIASES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS party_aliases (
    id SERIAL PRIMARY KEY,
    current_name VARCHAR(10) NOT NULL,
    alias_name VARCHAR(10) NOT NULL,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(current_name, alias_name)
);

-- Insert known party name changes
INSERT INTO party_aliases (current_name, alias_name, valid_from, valid_to) VALUES
('L', 'FP', '1900-01-01', '2015-11-08'),  -- Folkpartiet -> Liberalerna
('L', 'L', '2015-11-09', NULL),           -- Current name
('KD', 'KDS', '1900-01-01', '1996-04-01'),-- Kristdemokratiska Samhällspartiet -> Kristdemokraterna
('KD', 'KD', '1996-04-02', NULL),         -- Current name
('MP', 'MpG', '1900-01-01', '1993-01-01'),-- Miljöpartiet de gröna (old abbreviation)
('MP', 'MP', '1993-01-02', NULL)          -- Current name
ON CONFLICT (current_name, alias_name) DO NOTHING;


-- ============================================
-- 6. ADD INDEXES FOR BETTER PERFORMANCE
-- ============================================

-- Ledamöter
CREATE INDEX IF NOT EXISTS idx_ledamoter_parti ON riksdagen_ledamoter (parti);
CREATE INDEX IF NOT EXISTS idx_ledamoter_valkrets ON riksdagen_ledamoter (valkrets);
CREATE INDEX IF NOT EXISTS idx_ledamoter_status ON riksdagen_ledamoter (status);

-- Anföranden
CREATE INDEX IF NOT EXISTS idx_anforanden_parti ON riksdagen_anforanden (parti);
CREATE INDEX IF NOT EXISTS idx_anforanden_systemdatum ON riksdagen_anforanden (systemdatum);
CREATE INDEX IF NOT EXISTS idx_anforanden_dok_datum ON riksdagen_anforanden (dok_datum);

-- Voteringar
CREATE INDEX IF NOT EXISTS idx_voteringar_rm ON riksdagen_voteringar (rm);
CREATE INDEX IF NOT EXISTS idx_voteringar_systemdatum ON riksdagen_voteringar (systemdatum);


-- ============================================
-- 7. ADD VIEWS FOR EASIER QUERYING
-- ============================================

-- View that includes all party aliases
CREATE OR REPLACE VIEW ledamoter_with_aliases AS
SELECT
    l.*,
    pa.alias_name,
    pa.valid_from,
    pa.valid_to
FROM riksdagen_ledamoter l
LEFT JOIN party_aliases pa ON l.parti = pa.current_name;

-- View for current members only
CREATE OR REPLACE VIEW current_ledamoter AS
SELECT * FROM riksdagen_ledamoter
WHERE status = 'Tjänstgörande riksdagsledamot';

-- View for voting statistics
CREATE OR REPLACE VIEW votering_statistics AS
SELECT
    rm,
    COUNT(*) as total_voteringar,
    SUM(ja_roster) as total_ja,
    SUM(nej_roster) as total_nej,
    SUM(avstar_roster) as total_avstar,
    SUM(franvarande_roster) as total_franvarande,
    AVG(ja_roster + nej_roster + avstar_roster + franvarande_roster) as avg_deltagare
FROM riksdagen_voteringar
GROUP BY rm
ORDER BY rm DESC;


-- ============================================
-- 8. MIGRATION COMPLETE
-- ============================================

COMMENT ON TABLE party_aliases IS 'Maps current party names to historical aliases (e.g. FP -> L)';
COMMENT ON VIEW ledamoter_with_aliases IS 'Members with all party name aliases included';
COMMENT ON VIEW current_ledamoter IS 'Currently serving members of parliament';
COMMENT ON VIEW votering_statistics IS 'Aggregated voting statistics per riksmöte';
