#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys

# Adicionar o diretório pai ao path do Python
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configurar variáveis de ambiente
os.environ['SCRIPT_NAME'] = ''

# Importar a aplicação Flask
from app import app as application

# Executar com WSGI
if __name__ == '__main__':
    from wsgiref.handlers import CGIHandler
    CGIHandler().run(application)
