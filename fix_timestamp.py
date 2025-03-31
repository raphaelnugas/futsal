import sqlite3
import os
from datetime import datetime

# Configuração
DB_PATH = 'instance/futsal_domingo.db'

def fix_timestamp_field():
    """Corrige o campo timer_last_updated para ser um objeto TIMESTAMP válido"""
    
    if not os.path.exists(DB_PATH):
        print(f"Erro: Banco de dados não encontrado em {DB_PATH}")
        return False
    
    # Criar backup antes de modificar
    try:
        import shutil
        backup_path = f"{DB_PATH}.bak_fix_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        shutil.copy2(DB_PATH, backup_path)
        print(f"Backup do banco de dados criado: {backup_path}")
    except Exception as e:
        print(f"Aviso: Não foi possível criar backup do banco de dados: {str(e)}")
        user_input = input("Continuar mesmo sem backup? (s/n): ").lower()
        if user_input != 's':
            return False
    
    # Conectar ao banco de dados
    print(f"Conectando ao banco de dados: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Verificar o tipo atual da coluna
        cursor.execute("PRAGMA table_info(match)")
        columns = cursor.fetchall()
        timestamp_column = next((col for col in columns if col[1] == 'timer_last_updated'), None)
        
        if not timestamp_column:
            print("Coluna timer_last_updated não encontrada")
            return False
        
        print(f"Tipo atual da coluna timer_last_updated: {timestamp_column[2]}")
        
        # Ver valores atuais
        cursor.execute("SELECT id, timer_last_updated FROM match")
        rows = cursor.fetchall()
        
        print(f"Valores atuais do campo timer_last_updated:")
        for row in rows:
            print(f"ID: {row[0]}, Valor: {row[1]}")
        
        # Atualizar para timestamp no formato ISO
        print("\nCorrigindo valores de timestamp...")
        for row in rows:
            match_id = row[0]
            cursor.execute(
                "UPDATE match SET timer_last_updated = ? WHERE id = ?", 
                (datetime.now().isoformat(), match_id)
            )
            print(f"Atualizado match_id {match_id} com novo timestamp {datetime.now().isoformat()}")
        
        conn.commit()
        print("Correção aplicada com sucesso!")
        
        # Verificar valores atualizados
        cursor.execute("SELECT id, timer_last_updated FROM match")
        updated_rows = cursor.fetchall()
        
        print(f"\nValores atualizados do campo timer_last_updated:")
        for row in updated_rows:
            print(f"ID: {row[0]}, Valor: {row[1]}")
        
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"Erro ao corrigir campo timestamp: {str(e)}")
        return False
    
    finally:
        conn.close()

if __name__ == "__main__":
    print("=== Script para Corrigir Campo timer_last_updated ===")
    
    user_input = input("Continuar com a correção? (s/n): ").lower()
    if user_input == 's':
        if fix_timestamp_field():
            print("\nCorreção concluída com sucesso!")
        else:
            print("\nCorreção falhou. Verifique os erros acima.")
    else:
        print("Correção cancelada pelo usuário.") 