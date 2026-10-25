-- Table simple de patients (données FICTIVES uniquement)
CREATE TABLE IF NOT EXISTS patients (
    id          SERIAL PRIMARY KEY,
    nom         VARCHAR(100) NOT NULL,
    prenom      VARCHAR(100) NOT NULL,
    date_naissance DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un index sur le nom pour accélérer les recherches par nom
CREATE INDEX IF NOT EXISTS idx_patients_nom ON patients (nom);

-- Quelques données fictives pour tester le GET
INSERT INTO patients (nom, prenom, date_naissance) VALUES
    ('Test', 'Alpha', '1990-01-15'),
    ('Exemple', 'Beta', '1985-06-30');
