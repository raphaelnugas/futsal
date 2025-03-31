import json
import os
import sqlite3
import sys

def restore_from_backup(backup_dir=None):
    """Restaura dados de arquivos de backup JSON para o banco de dados"""
    if not backup_dir:
        # Solicitar diretório de backup
        backup_dir = input("Digite o caminho do diretório de backup (padrão: 'backup'): ").strip() or 'backup'
    
    if not os.path.exists(backup_dir):
        print(f"Erro: Diretório de backup '{backup_dir}' não encontrado.")
        return False
    
    # Listar arquivos de backup disponíveis
    backup_files = {}
    for i, filename in enumerate(os.listdir(backup_dir)):
        if filename.endswith('.json'):
            backup_files[i+1] = filename
            print(f"{i+1}. {filename}")
    
    if not backup_files:
        print(f"Nenhum arquivo de backup encontrado em '{backup_dir}'.")
        return False
    
    # Permitir seleção de grupo de arquivos por timestamp
    timestamps = set()
    for filename in backup_files.values():
        if '_backup_' in filename:
            parts = filename.split('_backup_')
            if len(parts) > 1 and parts[1].endswith('.json'):
                timestamp = parts[1][:-5]  # Remover '.json'
                timestamps.add(timestamp)
    
    print("\nTimestamps disponíveis:")
    timestamps = sorted(list(timestamps))
    for i, timestamp in enumerate(timestamps):
        print(f"{i+1}. {timestamp}")
    
    choice = input("\nSelecione o número do timestamp para restaurar (ou 0 para sair): ")
    if not choice.isdigit() or int(choice) == 0:
        return False
    
    try:
        selected_timestamp = timestamps[int(choice) - 1]
    except (IndexError, ValueError):
        print("Seleção inválida.")
        return False
    
    # Encontrar arquivos com o timestamp selecionado
    files_to_restore = {
        'player': None, 
        'goal': None,
        'match': None,
        'session': None,
        'player_match': None
    }
    
    for filename in os.listdir(backup_dir):
        if f'_backup_{selected_timestamp}.json' in filename:
            table_name = filename.split('_backup_')[0]
            if table_name in files_to_restore:
                files_to_restore[table_name] = os.path.join(backup_dir, filename)
    
    # Confirmar restauração
    print("\nArquivos que serão restaurados:")
    for table, filepath in files_to_restore.items():
        status = "✓" if filepath else "✗"
        print(f"{status} {table}: {os.path.basename(filepath) if filepath else 'não encontrado'}")
    
    confirm = input("\nConfirma a restauração? (s/n): ").lower()
    if confirm != 's':
        print("Restauração cancelada.")
        return False
    
    # Conectar ao banco de dados
    db_path = input("Digite o caminho do banco de dados (padrão: 'instance/futsal.db'): ").strip() or 'instance/futsal.db'
    if not os.path.exists(db_path):
        print(f"Erro: Banco de dados '{db_path}' não encontrado.")
        return False
    
    # Fazer backup do banco atual antes de restaurar
    import shutil
    from datetime import datetime
    backup_db_path = f"{db_path}.bak_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(db_path, backup_db_path)
    print(f"Backup do banco de dados atual criado: {backup_db_path}")
    
    # Restaurar dados
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        for table, filepath in files_to_restore.items():
            if not filepath:
                continue
                
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            if not data:
                print(f"Nenhum dado encontrado para a tabela {table}.")
                continue
                
            # Obter colunas da tabela
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [col[1] for col in cursor.fetchall()]
            
            # Limpar tabela
            print(f"Limpando tabela {table}...")
            cursor.execute(f"DELETE FROM {table}")
            
            # Inserir dados
            print(f"Restaurando {len(data)} registros na tabela {table}...")
            for row in data:
                # Filtrar apenas colunas existentes na tabela
                filtered_row = {k: v for k, v in row.items() if k in columns}
                placeholders = ', '.join(['?'] * len(filtered_row))
                columns_str = ', '.join(filtered_row.keys())
                
                cursor.execute(
                    f"INSERT INTO {table} ({columns_str}) VALUES ({placeholders})",
                    list(filtered_row.values())
                )
        
        conn.commit()
        print("\nRestauração concluída com sucesso!")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"Erro durante a restauração: {str(e)}")
        print(f"O banco de dados foi restaurado ao estado anterior: {backup_db_path}")
        return False
        
    finally:
        conn.close()

if __name__ == "__main__":
    # Verificar se um diretório de backup foi passado como argumento
    backup_dir = sys.argv[1] if len(sys.argv) > 1 else None
    restore_from_backup(backup_dir) 