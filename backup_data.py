import json
import os
import sqlite3
from datetime import datetime

# Configuração
BACKUP_DIR = 'backup'
DB_PATH = 'instance/futsal_domingo.db'

# Criar diretório de backup se não existir
if not os.path.exists(BACKUP_DIR):
    os.makedirs(BACKUP_DIR)

# Nome dos arquivos de backup com timestamp
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
players_backup_file = os.path.join(BACKUP_DIR, f'players_backup_{timestamp}.json')
goals_backup_file = os.path.join(BACKUP_DIR, f'goals_backup_{timestamp}.json')
matches_backup_file = os.path.join(BACKUP_DIR, f'matches_backup_{timestamp}.json')
sessions_backup_file = os.path.join(BACKUP_DIR, f'sessions_backup_{timestamp}.json')
player_matches_backup_file = os.path.join(BACKUP_DIR, f'player_matches_backup_{timestamp}.json')

# Conectar ao banco de dados
conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row  # Para obter resultados como dicionários

def backup_table(table_name, file_path):
    """Faz backup de uma tabela em um arquivo JSON"""
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()
    
    # Converter objetos Row para dicionários
    data = [dict(row) for row in rows]
    
    # Salvar como JSON
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    
    print(f"Backup da tabela {table_name} concluído: {len(data)} registros salvos em {file_path}")
    return data

try:
    # Realizar backups
    players = backup_table('player', players_backup_file)
    goals = backup_table('goal', goals_backup_file)
    matches = backup_table('match', matches_backup_file)
    sessions = backup_table('session', sessions_backup_file)
    player_matches = backup_table('player_match', player_matches_backup_file)
    
    print("\nResumo do backup:")
    print(f"- Jogadores: {len(players)}")
    print(f"- Gols: {len(goals)}")
    print(f"- Partidas: {len(matches)}")
    print(f"- Sessões: {len(sessions)}")
    print(f"- Participações: {len(player_matches)}")
    print(f"\nTodos os arquivos de backup foram salvos no diretório '{BACKUP_DIR}'")

except Exception as e:
    print(f"Erro ao fazer backup: {str(e)}")

finally:
    conn.close() 