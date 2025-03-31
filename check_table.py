import sqlite3

# Configuração
DB_PATH = 'instance/futsal_domingo.db'

# Conectar ao banco de dados
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

try:
    # Verificar estrutura da tabela match
    print("Estrutura da tabela 'match':")
    cursor.execute("PRAGMA table_info(match)")
    columns = cursor.fetchall()
    
    for col in columns:
        print(f"- {col[1]} ({col[2]}), Default: {col[4]}")
    
    # Verificar se as colunas do cronômetro existem
    timer_columns = [col[1] for col in columns if col[1].startswith('timer_')]
    if timer_columns:
        print(f"\nColunas do cronômetro encontradas: {', '.join(timer_columns)}")
    else:
        print("\nNenhuma coluna de cronômetro encontrada.")
    
    # Verificar dados existentes
    cursor.execute("SELECT id, is_active, timer_seconds, timer_status, timer_last_updated FROM match")
    matches = cursor.fetchall()
    
    print(f"\nPartidas encontradas: {len(matches)}")
    for match in matches:
        print(f"ID: {match[0]}, Ativa: {match[1]}, Timer: {match[2]}s, Status: {match[3]}, Última atualização: {match[4]}")

except Exception as e:
    print(f"Erro ao verificar tabela: {str(e)}")

finally:
    conn.close() 