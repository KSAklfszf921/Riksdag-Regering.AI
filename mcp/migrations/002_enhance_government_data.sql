-- Migration: Förbättra Regeringskansliet-schema
-- Lägger till saknade kolumner och index för bättre prestanda

-- ============================================
-- 1. REGERINGSKANSLIET_PRESSMEDDELANDEN
-- ============================================

-- Lägg till saknade kolumner
ALTER TABLE regeringskansliet_pressmeddelanden
ADD COLUMN IF NOT EXISTS avsandare TEXT,
ADD COLUMN IF NOT EXISTS kategorier TEXT[],
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS uppdaterad_datum TIMESTAMP;

-- Lägg till index
CREATE INDEX IF NOT EXISTS idx_press_publicerad ON regeringskansliet_pressmeddelanden (publicerad_datum DESC);
CREATE INDEX IF NOT EXISTS idx_press_departement ON regeringskansliet_pressmeddelanden (departement);
CREATE INDEX IF NOT EXISTS idx_press_titel ON regeringskansliet_pressmeddelanden USING gin(to_tsvector('swedish', titel));

COMMENT ON TABLE regeringskansliet_pressmeddelanden IS 'Pressmeddelanden från Regeringskansliet (g0v.se)';


-- ============================================
-- 2. REGERINGSKANSLIET_PROPOSITIONER
-- ============================================

ALTER TABLE regeringskansliet_propositioner
ADD COLUMN IF NOT EXISTS beteckning TEXT,
ADD COLUMN IF NOT EXISTS avsandare TEXT,
ADD COLUMN IF NOT EXISTS kategorier TEXT[],
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS uppdaterad_datum TIMESTAMP,
ADD COLUMN IF NOT EXISTS riksdag_status TEXT,
ADD COLUMN IF NOT EXISTS utskott TEXT;

-- Lägg till index
CREATE INDEX IF NOT EXISTS idx_prop_beteckning ON regeringskansliet_propositioner (beteckning);
CREATE INDEX IF NOT EXISTS idx_prop_publicerad ON regeringskansliet_propositioner (publicerad_datum DESC);
CREATE INDEX IF NOT EXISTS idx_prop_departement ON regeringskansliet_propositioner (departement);
CREATE INDEX IF NOT EXISTS idx_prop_titel ON regeringskansliet_propositioner USING gin(to_tsvector('swedish', titel));

COMMENT ON COLUMN regeringskansliet_propositioner.riksdag_status IS 'Status i Riksdagen (t.ex. Under behandling, Antagen, Avvisad)';
COMMENT ON COLUMN regeringskansliet_propositioner.utskott IS 'Vilket utskott som behandlar propositionen';


-- ============================================
-- 3. REGERINGSKANSLIET_SOU (Statens offentliga utredningar)
-- ============================================

ALTER TABLE regeringskansliet_sou
ADD COLUMN IF NOT EXISTS beteckning TEXT,
ADD COLUMN IF NOT EXISTS avsandare TEXT,
ADD COLUMN IF NOT EXISTS kategorier TEXT[],
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS uppdaterad_datum TIMESTAMP,
ADD COLUMN IF NOT EXISTS remiss_svar_antal INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_sou_beteckning ON regeringskansliet_sou (beteckning);
CREATE INDEX IF NOT EXISTS idx_sou_publicerad ON regeringskansliet_sou (publicerad_datum DESC);
CREATE INDEX IF NOT EXISTS idx_sou_titel ON regeringskansliet_sou USING gin(to_tsvector('swedish', titel));

COMMENT ON TABLE regeringskansliet_sou IS 'Statens offentliga utredningar (SOU)';


-- ============================================
-- 4. REGERINGSKANSLIET_DS (Departementsserien)
-- ============================================

-- Rename if needed (departementsserien → ds for consistency)
ALTER TABLE IF EXISTS regeringskansliet_departementsserien RENAME TO regeringskansliet_ds;

ALTER TABLE regeringskansliet_ds
ADD COLUMN IF NOT EXISTS beteckning TEXT,
ADD COLUMN IF NOT EXISTS avsandare TEXT,
ADD COLUMN IF NOT EXISTS kategorier TEXT[],
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS uppdaterad_datum TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_ds_beteckning ON regeringskansliet_ds (beteckning);
CREATE INDEX IF NOT EXISTS idx_ds_publicerad ON regeringskansliet_ds (publicerad_datum DESC);
CREATE INDEX IF NOT EXISTS idx_ds_titel ON regeringskansliet_ds USING gin(to_tsvector('swedish', titel));

COMMENT ON TABLE regeringskansliet_ds IS 'Departementsserien (Ds)';


-- ============================================
-- 5. REGERINGSKANSLIET_REMISSER
-- ============================================

ALTER TABLE regeringskansliet_remisser
ADD COLUMN IF NOT EXISTS beteckning TEXT,
ADD COLUMN IF NOT EXISTS avsandare TEXT,
ADD COLUMN IF NOT EXISTS kategorier TEXT[],
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS uppdaterad_datum TIMESTAMP,
ADD COLUMN IF NOT EXISTS sista_svarsdag DATE,
ADD COLUMN IF NOT EXISTS antal_svar INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_remiss_publicerad ON regeringskansliet_remisser (publicerad_datum DESC);
CREATE INDEX IF NOT EXISTS idx_remiss_sista_svarsdag ON regeringskansliet_remisser (sista_svarsdag);
CREATE INDEX IF NOT EXISTS idx_remiss_titel ON regeringskansliet_remisser USING gin(to_tsvector('swedish', titel));

COMMENT ON COLUMN regeringskansliet_remisser.sista_svarsdag IS 'Sista dag för remissvar';
COMMENT ON COLUMN regeringskansliet_remisser.antal_svar IS 'Antal mottagna remissvar';


-- ============================================
-- 6. REGERINGSKANSLIET_TAL (Tal och anföranden)
-- ============================================

CREATE TABLE IF NOT EXISTS regeringskansliet_tal (
    id SERIAL PRIMARY KEY,
    titel TEXT NOT NULL,
    publicerad_datum DATE NOT NULL,
    uppdaterad_datum TIMESTAMP,
    talare TEXT,
    avsandare TEXT,
    departement TEXT,
    url TEXT,
    kategorier TEXT[],
    innehall TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tal_publicerad ON regeringskansliet_tal (publicerad_datum DESC);
CREATE INDEX IF NOT EXISTS idx_tal_talare ON regeringskansliet_tal (talare);
CREATE INDEX IF NOT EXISTS idx_tal_titel ON regeringskansliet_tal USING gin(to_tsvector('swedish', titel));

COMMENT ON TABLE regeringskansliet_tal IS 'Tal och anföranden från regeringen';


-- ============================================
-- 7. REGERINGSKANSLIET_UPPDRAG (Regeringsuppdrag)
-- ============================================

CREATE TABLE IF NOT EXISTS regeringskansliet_uppdrag (
    id SERIAL PRIMARY KEY,
    titel TEXT NOT NULL,
    publicerad_datum DATE NOT NULL,
    uppdaterad_datum TIMESTAMP,
    beteckning TEXT,
    avsandare TEXT,
    departement TEXT,
    mottagare TEXT,
    url TEXT,
    kategorier TEXT[],
    slutdatum DATE,
    status TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uppdrag_publicerad ON regeringskansliet_uppdrag (publicerad_datum DESC);
CREATE INDEX IF NOT EXISTS idx_uppdrag_status ON regeringskansliet_uppdrag (status);
CREATE INDEX IF NOT EXISTS idx_uppdrag_mottagare ON regeringskansliet_uppdrag (mottagare);
CREATE INDEX IF NOT EXISTS idx_uppdrag_titel ON regeringskansliet_uppdrag USING gin(to_tsvector('swedish', titel));

COMMENT ON TABLE regeringskansliet_uppdrag IS 'Regeringsuppdrag till myndigheter';
COMMENT ON COLUMN regeringskansliet_uppdrag.mottagare IS 'Myndighet som fått uppdraget';
COMMENT ON COLUMN regeringskansliet_uppdrag.status IS 'Status (Pågående, Slutförd, Redovisad)';


-- ============================================
-- 8. CREATE VIEWS FOR ANALYSIS
-- ============================================

-- View: Alla regeringsdokument samlade
CREATE OR REPLACE VIEW regeringen_all_documents AS
SELECT
    'Pressmeddelande' as typ,
    titel,
    publicerad_datum,
    departement,
    url,
    id
FROM regeringskansliet_pressmeddelanden
UNION ALL
SELECT
    'Proposition' as typ,
    titel,
    publicerad_datum,
    departement,
    url,
    id
FROM regeringskansliet_propositioner
UNION ALL
SELECT
    'SOU' as typ,
    titel,
    publicerad_datum,
    departement,
    url,
    id
FROM regeringskansliet_sou
UNION ALL
SELECT
    'Tal' as typ,
    titel,
    publicerad_datum,
    departement,
    url,
    id
FROM regeringskansliet_tal
ORDER BY publicerad_datum DESC;

COMMENT ON VIEW regeringen_all_documents IS 'Samlad vy över alla regeringsdokument';


-- View: Departement-statistik
CREATE OR REPLACE VIEW departement_statistik AS
SELECT
    departement,
    COUNT(*) as totalt_antal,
    SUM(CASE WHEN typ = 'Pressmeddelande' THEN 1 ELSE 0 END) as pressmeddelanden,
    SUM(CASE WHEN typ = 'Proposition' THEN 1 ELSE 0 END) as propositioner,
    SUM(CASE WHEN typ = 'SOU' THEN 1 ELSE 0 END) as utredningar,
    SUM(CASE WHEN typ = 'Tal' THEN 1 ELSE 0 END) as tal,
    MAX(publicerad_datum) as senaste_dokument
FROM regeringen_all_documents
WHERE departement IS NOT NULL
GROUP BY departement
ORDER BY totalt_antal DESC;

COMMENT ON VIEW departement_statistik IS 'Statistik per departement';


-- View: Propositioner i Riksdagen
CREATE OR REPLACE VIEW propositioner_riksdag_status AS
SELECT
    rp.id,
    rp.titel,
    rp.beteckning,
    rp.publicerad_datum,
    rp.departement,
    rp.riksdag_status,
    rd.dokument_url_html as riksdag_url,
    rd.datum as riksdag_datum,
    COUNT(DISTINCT rv.votering_id) as antal_voteringar
FROM regeringskansliet_propositioner rp
LEFT JOIN riksdagen_dokument rd
    ON rd.doktyp = 'prop'
    AND (rd.beteckning ILIKE '%' || rp.beteckning || '%'
         OR rp.beteckning ILIKE '%' || rd.beteckning || '%')
LEFT JOIN riksdagen_voteringar rv
    ON rv.beteckning ILIKE '%' || rp.beteckning || '%'
GROUP BY rp.id, rp.titel, rp.beteckning, rp.publicerad_datum, rp.departement, rp.riksdag_status, rd.dokument_url_html, rd.datum;

COMMENT ON VIEW propositioner_riksdag_status IS 'Propositioner med status från Riksdagen';


-- ============================================
-- 9. FULL-TEXT SEARCH CONFIGURATION
-- ============================================

-- Swedish language configuration
ALTER TEXT SEARCH CONFIGURATION swedish SET dictionary FOR stemming TO swedish_stem;

-- Update existing GIN indexes to use swedish configuration
DROP INDEX IF EXISTS idx_press_titel;
CREATE INDEX idx_press_titel ON regeringskansliet_pressmeddelanden USING gin(to_tsvector('swedish', titel));

DROP INDEX IF EXISTS idx_prop_titel;
CREATE INDEX idx_prop_titel ON regeringskansliet_propositioner USING gin(to_tsvector('swedish', titel));


-- ============================================
-- 10. TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.uppdaterad_datum = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename LIKE 'regeringskansliet_%'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t);
    END LOOP;
END $$;


-- ============================================
-- 11. MIGRATION COMPLETE
-- ============================================

COMMENT ON SCHEMA public IS 'Enhanced schema for Regeringskansliet data with full-text search and analytics views';
