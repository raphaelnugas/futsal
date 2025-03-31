#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import subprocess
import platform

def is_venv():
    """Verifica se está rodando em um ambiente virtual."""
    return (hasattr(sys, 'real_prefix') or
            (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix))

def main():
    """Configurar o ambiente para o projeto."""
    # Verificar versão do Python
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print("Erro: É necessário Python 3.8 ou superior.")
        print(f"Versão atual: {platform.python_version()}")
        sys.exit(1)

    # Verificar se está em um ambiente virtual
    if not is_venv():
        print("Aviso: Não está rodando em um ambiente virtual.")
        create_venv = input("Deseja criar um ambiente virtual? (s/n): ")
        if create_venv.lower() == 's':
            subprocess.run([sys.executable, "-m", "venv", "venv"])
            
            # Instrução para ativar o ambiente virtual
            if platform.system() == "Windows":
                print("\nPara ativar o ambiente virtual, execute:")
                print("venv\\Scripts\\activate")
            else:
                print("\nPara ativar o ambiente virtual, execute:")
                print("source venv/bin/activate")
                
            print("\nDepois, execute este script novamente.")
            sys.exit(0)

    # Instalar dependências
    print("Instalando dependências...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    
    print("\nConfiguração concluída!")
    print("Para iniciar o aplicativo, execute: python local_test.py")

if __name__ == "__main__":
    main() 