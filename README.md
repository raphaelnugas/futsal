# Futsal de Domingo

Sistema para gerenciamento de partidas de futsal.

## Requisitos

- Python 3.8 ou superior
- SQLite (padrão) ou PostgreSQL
- Navegador Web moderno (Chrome, Firefox, Edge, Safari)

## Instalação e Execução Local

### Windows

1. **Instalação do Python**:
   - Baixe e instale o Python 3.8+ do [site oficial](https://www.python.org/downloads/)
   - Durante a instalação, marque a opção "Add Python to PATH"

2. **Configuração do Projeto**:
   ```
   git clone https://seu-repositorio/futsal.git
   cd futsal
   python setup.py
   ```

3. **Ativação do Ambiente Virtual**:
   ```
   venv\Scripts\activate
   ```

4. **Execução**:
   ```
   python local_test.py
   ```

### Linux/Mac

1. **Instalação do Python**:
   ```
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install python3 python3-pip python3-venv

   # Mac
   brew install python
   ```

2. **Configuração do Projeto**:
   ```
   git clone https://seu-repositorio/futsal.git
   cd futsal
   python3 setup.py
   ```

3. **Ativação do Ambiente Virtual**:
   ```
   source venv/bin/activate
   ```

4. **Execução**:
   ```
   python local_test.py
   ```

## Atualizações e Migrações do Banco de Dados

Se você estiver atualizando uma instalação existente, pode ser necessário atualizar o esquema do banco de dados:

1. **Aplicando migrações**:
   - Pare a aplicação
   - Ative o ambiente virtual
   - Execute o comando SQL no arquivo migrations.sql:
   ```
   # SQLite
   sqlite3 instance/futsal.db < migrations.sql
   
   # PostgreSQL
   psql -U seu_usuario -d seu_banco -f migrations.sql
   ```
   - Reinicie a aplicação

## Implantação em Produção

### Hospedagem Compartilhada com Apache

1. Faça upload de todos os arquivos para o servidor
2. Certifique-se de que Python está disponível no servidor
3. Configure os caminhos no arquivo `.htaccess`
4. Torne o arquivo `cgi-bin/app.cgi` executável: `chmod +x cgi-bin/app.cgi`

### PythonAnywhere

1. Crie uma conta no [PythonAnywhere](https://www.pythonanywhere.com/)
2. Faça upload do projeto
3. Configurar um aplicativo web:
   - Escolha Flask como framework
   - Configure `wsgi.py` como ponto de entrada
   - Configure variáveis de ambiente necessárias

### Heroku

1. Crie uma conta no [Heroku](https://www.heroku.com/)
2. Instale o [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. Execute:
   ```
   heroku login
   heroku create
   git push heroku master
   ```

## Organização do Projeto

- `app.py`: Configuração principal da aplicação Flask
- `models.py`: Modelos de dados (jogadores, partidas, etc.)
- `routes.py`: Rotas e endpoints da API
- `static/`: Arquivos estáticos (CSS, JavaScript, imagens)
- `templates/`: Templates HTML
- `instance/`: Diretório para o banco de dados SQLite

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature: `git checkout -b minha-feature`
3. Commit suas mudanças: `git commit -m 'Adicionando nova feature'`
4. Push para a branch: `git push origin minha-feature`
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes. 