import os
import sqlite3
import sys

def apply_migration():
    """
    Aplica migrações ao banco de dados.
    """
    print("Iniciando aplicação de migrações...")
    
    # Obter caminho absoluto do banco de dados
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'futsal_domingo.db')
    
    # Verificar se o banco de dados existe
    if not os.path.exists(db_path):
        print(f"Erro: Banco de dados não encontrado em {db_path}")
        sys.exit(1)
    
    # Conectar ao banco de dados
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Verificar versão atual do banco de dados
    try:
        cursor.execute("SELECT value FROM config WHERE key='db_version'")
        result = cursor.fetchone()
        current_version = result[0] if result else '1.0'
        print(f"Versão atual do banco de dados: {current_version}")
    except sqlite3.OperationalError:
        print("Tabela de configuração não encontrada. Assumindo versão 1.0")
        current_version = '1.0'
        # Criar tabela de configuração se não existir
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
        cursor.execute("INSERT INTO config (key, value) VALUES ('db_version', '1.0')")
        conn.commit()
    
    # Definir migrações disponíveis (versão -> SQL)
    migrations = {
        '1.1': [
            "ALTER TABLE match ADD COLUMN team_a TEXT;",
            "ALTER TABLE match ADD COLUMN team_b TEXT;"
        ],
        '1.2': [
            "ALTER TABLE historical_stat ADD COLUMN retroactive_matches INTEGER DEFAULT 0;",
            "ALTER TABLE historical_stat ADD COLUMN retroactive_sessions INTEGER DEFAULT 0;",
            "ALTER TABLE historical_stat ADD COLUMN played_as_goalkeeper BOOLEAN DEFAULT 0;"
        ]
    }
    
    # Aplicar migrações na ordem correta
    versions = sorted([v for v in migrations.keys() if v > current_version])
    
    if not versions:
        print("Banco de dados já está na versão mais recente.")
        conn.close()
        return
    
    try:
        for version in versions:
            print(f"Aplicando migração para versão {version}...")
            
            for sql in migrations[version]:
                try:
                    print(f"Executando: {sql}")
                    cursor.execute(sql)
                except sqlite3.OperationalError as e:
                    # Ignorar erro se a coluna já existir
                    if "duplicate column" in str(e) or "already exists" in str(e):
                        print(f"Aviso: {e}")
                    else:
                        raise
            
            # Atualizar versão do banco de dados
            cursor.execute("UPDATE config SET value = ? WHERE key = 'db_version'", (version,))
            print(f"Versão atualizada para {version}")
        
        conn.commit()
        print("Migrações aplicadas com sucesso!")
    except Exception as e:
        conn.rollback()
        print(f"Erro ao aplicar migrações: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    apply_migration() 