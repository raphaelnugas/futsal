-- Adiciona as colunas para gerenciamento do cronômetro na tabela Match
ALTER TABLE match ADD COLUMN timer_seconds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE match ADD COLUMN timer_status VARCHAR(10) NOT NULL DEFAULT 'stopped';
ALTER TABLE match ADD COLUMN timer_last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Atualiza o timer_last_updated para todas as partidas existentes
UPDATE match SET timer_last_updated = CURRENT_TIMESTAMP;

-- Adicionar coluna team à tabela match (v1.1)
ALTER TABLE match ADD COLUMN team_a TEXT;
ALTER TABLE match ADD COLUMN team_b TEXT;

-- Adicionar colunas para partidas retroativas na tabela historical_stat (v1.2)
ALTER TABLE historical_stat ADD COLUMN retroactive_matches INTEGER DEFAULT 0;
ALTER TABLE historical_stat ADD COLUMN retroactive_sessions INTEGER DEFAULT 0;
ALTER TABLE historical_stat ADD COLUMN played_as_goalkeeper BOOLEAN DEFAULT FALSE; 