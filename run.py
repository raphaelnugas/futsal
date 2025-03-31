#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os
import traceback
import time
import logging

# Configurar logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("flask_app.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("futsal_app")

try:
    logger.info("Iniciando carregamento da aplicação Flask")
    
    # Usar porta 5000 como solicitado
    PORT = 5000
    
    # Verificar se está em Windows e detectar se outra aplicação está usando a porta
    if os.name == 'nt':
        import socket
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', PORT))
                s.close()
                logger.info(f"Porta {PORT} está disponível")
        except socket.error:
            logger.error(f"ERRO: Porta {PORT} está em uso por outro processo! Execute 'python check_port.py'")
            print(f"\n\n===== ERRO DE PORTA =====")
            print(f"A porta {PORT} está em uso por outro processo.")
            print("Verifique se há outros serviços usando esta porta.")
            print("=====================================\n\n")
            time.sleep(5)  # Dar tempo para o usuário ler a mensagem
    
    # Importar a aplicação Flask - pode gerar exceções se o app.py tiver problemas
    try:
        from app import app
        logger.info("Aplicação Flask importada com sucesso")
    except Exception as e:
        logger.error(f"Erro ao importar a aplicação Flask: {str(e)}")
        logger.error(traceback.format_exc())
        raise
    
    if __name__ == "__main__":
        port = int(os.environ.get("PORT", PORT))
        logger.info(f"Iniciando servidor na porta {port}")
        
        try:
            print(f"\n\n===== SERVIDOR INICIADO =====")
            print(f"Acesse o aplicativo em: http://localhost:{port}")
            print("=====================================\n\n")
            app.run(host="0.0.0.0", port=port, debug=True)
        except Exception as e:
            logger.error(f"Erro ao iniciar o servidor: {str(e)}")
            logger.error(traceback.format_exc())
            print(f"\n\nERRO AO INICIAR SERVIDOR: {str(e)}")
            print("Verifique o arquivo flask_app.log para mais detalhes.")
            time.sleep(10)  # Manter a janela aberta para o usuário ler a mensagem
            raise

except Exception as e:
    # Capturar qualquer exceção não tratada
    error_message = f"Erro não tratado: {str(e)}"
    traceback_str = traceback.format_exc()
    
    try:
        logger.critical(error_message)
        logger.critical(traceback_str)
    except:
        # Se o logger falhar, escrever em um arquivo de texto
        with open("error.log", "a") as f:
            f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} - ERRO CRÍTICO: {error_message}\n")
            f.write(traceback_str)
            f.write("\n\n")
    
    # Imprimir o erro para que o usuário possa ver
    print("\n\n===== ERRO CRÍTICO =====")
    print(error_message)
    print("\nTraceback:")
    print(traceback_str)
    print("===========================\n")
    print("O erro foi registrado em error.log ou flask_app.log")
    print("Execute 'python check_port.py' para verificar problemas comuns.")
    
    # Manter a janela aberta
    if os.name == 'nt':
        print("\nPressione Enter para sair...")
        input() 