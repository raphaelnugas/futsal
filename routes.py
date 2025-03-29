from datetime import datetime, date, timedelta
import json
from functools import wraps
from flask import render_template, request, jsonify, redirect, url_for, session, flash
from sqlalchemy import func, desc, and_, extract
from app import app, db
from models import Player, Session, Match, PlayerMatch, Goal, Settings, EventLog, GlobalStats

# ----- Utilitários e Decoradores -----

def login_required(f):
    """Decorador para verificar se o usuário está autenticado."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('authenticated'):
            # Redireciona para a página de login se não estiver autenticado
            flash('Por favor, faça login para acessar esta página.', 'warning')
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    return decorated_function

def log_event(event_type, description=None, session_id=None, match_id=None):
    """Registra um evento no log de eventos."""
    event = EventLog(
        event_type=event_type,
        session_id=session_id,
        match_id=match_id,
        description=description,
        timestamp=datetime.now()
    )
    db.session.add(event)
    db.session.commit()

def update_global_stats():
    """Atualiza as estatísticas globais."""
    stats = GlobalStats.query.first()
    
    if not stats:
        stats = GlobalStats()
        db.session.add(stats)
    
    # Contar total de sessões
    stats.total_sessions = Session.query.count()
    
    # Contar total de partidas
    stats.total_matches = Match.query.count()
    
    # Contar vitórias por time
    stats.orange_wins = Match.query.filter_by(winner_team='orange').count()
    stats.black_wins = Match.query.filter_by(winner_team='black').count()
    
    # Contar gols por time
    stats.orange_goals = Goal.query.filter_by(team='orange').count()
    stats.black_goals = Goal.query.filter_by(team='black').count()
    
    # Atualizar timestamp
    stats.updated_at = datetime.now()
    
    db.session.commit()

# ----- Rotas de Interface Web -----

@app.route('/')
def dashboard():
    """Rota principal que exibe o dashboard com estatísticas."""
    return render_template('dashboard.html', authenticated=session.get('authenticated', False))

@app.route('/players')
@login_required
def players():
    """Rota para gerenciar jogadores."""
    return render_template('players.html')

@app.route('/session/<date_str>')
@login_required
def session_view(date_str):
    """Rota para visualizar/gerenciar uma sessão específica."""
    try:
        session_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        return render_template('session.html', session_date=date_str)
    except ValueError:
        flash('Data inválida.', 'error')
        return redirect(url_for('dashboard'))

@app.route('/match/<int:match_id>')
@login_required
def match_view(match_id):
    """Rota para uma partida específica."""
    match = Match.query.get_or_404(match_id)
    return render_template('match.html', match_id=match_id)

@app.route('/sessions')
@login_required
def sessions_calendar():
    """Rota para o calendário de sessões."""
    return render_template('sessions_calendar.html')

@app.route('/settings')
@login_required
def settings():
    """Rota para configurações do sistema."""
    return render_template('settings.html')

# ----- Rotas de API -----

@app.route('/api/login', methods=['POST'])
def login():
    """API para autenticação."""
    data = request.json
    password = data.get('password', '')
    
    settings = Settings.query.first()
    if settings and password == settings.master_password:
        session['authenticated'] = True
        return jsonify({'success': True, 'message': 'Autenticado com sucesso!'})
    
    return jsonify({'success': False, 'message': 'Senha incorreta!'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    """API para encerrar a sessão."""
    session.pop('authenticated', None)
    return jsonify({'success': True, 'message': 'Logout realizado com sucesso!'})

# ----- APIs de Jogadores -----

@app.route('/api/players', methods=['GET'])
def get_players():
    """API para obter todos os jogadores."""
    players = Player.query.all()
    return jsonify([player.to_dict() for player in players])

@app.route('/api/players', methods=['POST'])
@login_required
def create_player():
    """API para criar um novo jogador."""
    data = request.json
    
    player = Player(
        name=data.get('name'),
        is_goalkeeper=data.get('is_goalkeeper', False),
        photo_url=data.get('photo_url')
    )
    
    db.session.add(player)
    db.session.commit()
    
    return jsonify({'success': True, 'player': player.to_dict()})

@app.route('/api/players/<int:player_id>', methods=['PUT'])
@login_required
def update_player(player_id):
    """API para atualizar um jogador existente."""
    player = Player.query.get_or_404(player_id)
    data = request.json
    
    player.name = data.get('name', player.name)
    player.is_goalkeeper = data.get('is_goalkeeper', player.is_goalkeeper)
    player.photo_url = data.get('photo_url', player.photo_url)
    player.updated_at = datetime.now()
    
    db.session.commit()
    
    return jsonify({'success': True, 'player': player.to_dict()})

@app.route('/api/players/<int:player_id>', methods=['DELETE'])
@login_required
def delete_player(player_id):
    """API para excluir um jogador."""
    player = Player.query.get_or_404(player_id)
    
    # Verificar se o jogador tem histórico
    has_goals = Goal.query.filter(
        (Goal.scorer_id == player_id) | (Goal.assistant_id == player_id)
    ).first() is not None
    
    has_matches = PlayerMatch.query.filter_by(player_id=player_id).first() is not None
    
    if has_goals or has_matches:
        return jsonify({
            'success': False, 
            'message': 'Não é possível excluir um jogador com histórico de partidas ou gols.'
        }), 400
    
    db.session.delete(player)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Jogador excluído com sucesso!'})

# ----- APIs de Sessões -----

@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    """API para obter todas as sessões."""
    sessions = Session.query.order_by(Session.date.desc()).all()
    return jsonify([s.to_dict() for s in sessions])

@app.route('/api/sessions/active', methods=['GET'])
def get_active_session():
    """API para obter a sessão ativa, se houver."""
    active_session = Session.query.filter_by(is_active=True).first()
    if active_session:
        return jsonify(active_session.to_dict())
    return jsonify(None)

@app.route('/api/sessions', methods=['POST'])
@login_required
def create_session():
    """API para criar uma nova sessão."""
    data = request.json
    session_date_str = data.get('date')
    
    try:
        session_date = datetime.strptime(session_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'success': False, 'message': 'Formato de data inválido.'}), 400
    
    # Verificar se já existe uma sessão para esta data
    existing_session = Session.query.filter_by(date=session_date).first()
    if existing_session:
        return jsonify({
            'success': False, 
            'message': 'Já existe uma sessão para esta data.'
        }), 400
    
    # Verificar se há uma sessão ativa e encerrá-la
    active_session = Session.query.filter_by(is_active=True).first()
    if active_session:
        active_session.is_active = False
        active_session.end_time = datetime.now()
        log_event('session_end', f'Sessão encerrada: {active_session.date}', session_id=active_session.id)
    
    # Criar nova sessão
    new_session = Session(
        date=session_date,
        start_time=datetime.now(),
        is_active=True
    )
    
    db.session.add(new_session)
    db.session.commit()
    
    log_event('session_start', f'Sessão iniciada: {session_date}', session_id=new_session.id)
    update_global_stats()
    
    return jsonify({'success': True, 'session': new_session.to_dict()})

@app.route('/api/sessions/<int:session_id>/end', methods=['POST'])
@login_required
def end_session(session_id):
    """API para encerrar uma sessão."""
    session_obj = Session.query.get_or_404(session_id)
    
    if not session_obj.is_active:
        return jsonify({'success': False, 'message': 'Esta sessão já está encerrada.'}), 400
    
    # Encerrar partidas ativas
    active_matches = Match.query.filter_by(session_id=session_id, is_active=True).all()
    for match in active_matches:
        match.is_active = False
        match.end_time = datetime.now()
        log_event('match_end', f'Partida encerrada (fim da sessão)', session_id=session_id, match_id=match.id)
    
    # Encerrar a sessão
    session_obj.is_active = False
    session_obj.end_time = datetime.now()
    
    db.session.commit()
    
    log_event('session_end', f'Sessão encerrada: {session_obj.date}', session_id=session_id)
    update_global_stats()
    
    return jsonify({'success': True, 'message': 'Sessão encerrada com sucesso!'})

@app.route('/api/sessions/<date_str>', methods=['GET'])
def get_session_by_date(date_str):
    """API para obter uma sessão por data."""
    try:
        session_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'success': False, 'message': 'Formato de data inválido.'}), 400
    
    session_obj = Session.query.filter_by(date=session_date).first()
    if not session_obj:
        return jsonify(None)
    
    return jsonify(session_obj.to_dict())

@app.route('/api/sessions/next-sundays', methods=['GET'])
def get_next_sundays():
    """API para obter os próximos domingos para o calendário."""
    today = date.today()
    
    # Se hoje é domingo (weekday=6), days_ahead deve ser 0 (hoje)
    # Se hoje é segunda (weekday=0), days_ahead deve ser 6 (próximo domingo)
    days_ahead = (7 - today.weekday()) % 7  # 7 em vez de 6 para corrigir o cálculo
    
    # Se hoje for domingo, considere o domingo de hoje
    next_sunday = today + timedelta(days=days_ahead)
    
    # Gerar 10 domingos a partir do próximo (ou do atual, se for domingo)
    future_sundays = []
    for i in range(10):
        sunday = next_sunday + timedelta(days=i*7)
        
        # Verificar se já existe uma sessão para este domingo
        session_exists = Session.query.filter_by(date=sunday).first() is not None
        
        future_sundays.append({
            'date': sunday.isoformat(),
            'exists': session_exists
        })
    
    # Gerar 10 domingos passados (até 10 semanas atrás)
    past_sundays = []
    for i in range(1, 11):  # Começa em 1 para não incluir o próximo domingo novamente
        past_sunday = next_sunday - timedelta(days=i*7)
        
        # Verificar se já existe uma sessão para este domingo
        session_exists = Session.query.filter_by(date=past_sunday).first() is not None
        
        # Só adiciona domingos passados se já existir sessão
        if session_exists:
            past_sundays.append({
                'date': past_sunday.isoformat(),
                'exists': True
            })
    
    # Combinar os próximos domingos com domingos passados que têm sessão
    sundays = future_sundays + past_sundays
    
    return jsonify(sundays)

# ----- APIs de Partidas -----

@app.route('/api/sessions/<int:session_id>/matches', methods=['GET'])
def get_session_matches(session_id):
    """API para obter todas as partidas de uma sessão."""
    matches = Match.query.filter_by(session_id=session_id).order_by(Match.match_number).all()
    return jsonify([match.to_dict() for match in matches])

@app.route('/api/matches/<int:match_id>', methods=['GET'])
def get_match(match_id):
    """API para obter detalhes de uma partida específica."""
    match = Match.query.get_or_404(match_id)
    
    # Obter dados da partida
    match_data = match.to_dict()
    
    # Obter jogadores por time
    orange_players = PlayerMatch.query.filter_by(match_id=match_id, team='orange').all()
    black_players = PlayerMatch.query.filter_by(match_id=match_id, team='black').all()
    
    # Mapear IDs para detalhes dos jogadores
    player_ids = [pm.player_id for pm in orange_players + black_players]
    players_map = {p.id: p for p in Player.query.filter(Player.id.in_(player_ids)).all()}
    
    # Formatar dados dos times
    orange_team = []
    for pm in orange_players:
        player = players_map.get(pm.player_id)
        if player:
            orange_team.append({
                'player_id': player.id,
                'name': player.name,
                'is_goalkeeper': pm.played_as_goalkeeper,
                'goals_conceded': pm.goals_conceded if pm.played_as_goalkeeper else 0
            })
    
    black_team = []
    for pm in black_players:
        player = players_map.get(pm.player_id)
        if player:
            black_team.append({
                'player_id': player.id,
                'name': player.name,
                'is_goalkeeper': pm.played_as_goalkeeper,
                'goals_conceded': pm.goals_conceded if pm.played_as_goalkeeper else 0
            })
    
    # Obter gols da partida
    goals = Goal.query.filter_by(match_id=match_id).order_by(Goal.time).all()
    goals_data = []
    
    for goal in goals:
        scorer = players_map.get(goal.scorer_id)
        assistant = players_map.get(goal.assistant_id) if goal.assistant_id else None
        
        goals_data.append({
            'id': goal.id,
            'team': goal.team,
            'scorer_id': goal.scorer_id,
            'scorer_name': scorer.name if scorer else 'Desconhecido',
            'assistant_id': goal.assistant_id,
            'assistant_name': assistant.name if assistant else None,
            'time': goal.time.isoformat() if goal.time else None
        })
    
    # Montar resposta completa
    result = {
        'match': match_data,
        'orange_team': orange_team,
        'black_team': black_team,
        'goals': goals_data
    }
    
    return jsonify(result)

@app.route('/api/sessions/<int:session_id>/matches', methods=['POST'])
@login_required
def create_match(session_id):
    """API para criar uma nova partida na sessão."""
    session_obj = Session.query.get_or_404(session_id)
    
    if not session_obj.is_active:
        return jsonify({'success': False, 'message': 'Esta sessão já está encerrada.'}), 400
    
    data = request.json
    
    # Encerrar partidas ativas existentes
    active_matches = Match.query.filter_by(session_id=session_id, is_active=True).all()
    for active_match in active_matches:
        active_match.is_active = False
        active_match.end_time = datetime.now()
        log_event('match_end', 'Partida encerrada (nova partida iniciada)', session_id=session_id, match_id=active_match.id)
    
    # Determinar o número da próxima partida
    last_match = Match.query.filter_by(session_id=session_id).order_by(Match.match_number.desc()).first()
    match_number = 1 if not last_match else last_match.match_number + 1
    
    # Criar nova partida
    new_match = Match(
        session_id=session_id,
        start_time=datetime.now(),
        is_active=True,
        match_number=match_number
    )
    
    db.session.add(new_match)
    db.session.commit()
    
    # Registrar jogadores nos times
    orange_players = data.get('orange_team', [])
    black_players = data.get('black_team', [])
    
    for player_data in orange_players:
        player_match = PlayerMatch(
            player_id=player_data['player_id'],
            match_id=new_match.id,
            team='orange',
            played_as_goalkeeper=player_data.get('is_goalkeeper', False)
        )
        db.session.add(player_match)
    
    for player_data in black_players:
        player_match = PlayerMatch(
            player_id=player_data['player_id'],
            match_id=new_match.id,
            team='black',
            played_as_goalkeeper=player_data.get('is_goalkeeper', False)
        )
        db.session.add(player_match)
    
    db.session.commit()
    
    log_event('match_start', f'Partida {match_number} iniciada', session_id=session_id, match_id=new_match.id)
    
    return jsonify({
        'success': True, 
        'match_id': new_match.id,
        'match': new_match.to_dict()
    })

@app.route('/api/matches/<int:match_id>/end', methods=['POST'])
@login_required
def end_match(match_id):
    """API para encerrar uma partida."""
    try:
        match = Match.query.get_or_404(match_id)
        data = request.json
        
        if not match.is_active:
            return jsonify({'success': False, 'message': 'Esta partida já está encerrada.'}), 400
        
        winner_team = data.get('winner_team')
        
        if winner_team not in ['orange', 'black', None, '']:
            return jsonify({'success': False, 'message': 'Valor inválido para winner_team'}), 400
            
        match.winner_team = None if winner_team == '' else winner_team
        match.is_active = False
        match.end_time = datetime.now()
        
        db.session.commit()
        
        log_event('match_end', 
                 f'Partida encerrada com sucesso: {match.winner_team or "Empate"}',
                 session_id=match.session_id,
                 match_id=match.id)
        
        update_global_stats()
        
        return jsonify({'success': True, 'match': match.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao encerrar partida: {str(e)}")
        return jsonify({'success': False, 'message': 'Erro ao encerrar a partida.'}), 500
    
    # Registrar no log
    result_desc = "Empate" if not winner_team else f"Vitória do time {'Laranja' if winner_team == 'orange' else 'Preto'}"
    log_event('match_end', f'Partida encerrada: {result_desc}', session_id=match.session_id, match_id=match.id)
    
    update_global_stats()
    
    return jsonify({'success': True, 'match': match.to_dict()})

@app.route('/api/matches/<int:match_id>/goals', methods=['POST'])
@login_required
def add_goal(match_id):
    """API para adicionar um gol."""
    match = Match.query.get_or_404(match_id)
    data = request.json
    
    if not match.is_active:
        return jsonify({'success': False, 'message': 'Esta partida está encerrada.'}), 400
    
    team = data.get('team')  # 'orange' ou 'black'
    scorer_id = data.get('scorer_id')
    assistant_id = data.get('assistant_id')  # Pode ser None
    
    # Criar o gol
    goal = Goal(
        match_id=match_id,
        scorer_id=scorer_id,
        assistant_id=assistant_id,
        team=team,
        time=datetime.now()
    )
    
    db.session.add(goal)
    
    # Atualizar o placar da partida
    if team == 'orange':
        match.orange_score += 1
    else:
        match.black_score += 1
    
    # Atualizar gols sofridos pelo goleiro
    opponent_team = 'black' if team == 'orange' else 'orange'
    goalkeeper = PlayerMatch.query.filter_by(
        match_id=match_id, 
        team=opponent_team,
        played_as_goalkeeper=True
    ).first()
    
    if goalkeeper:
        goalkeeper.goals_conceded += 1
    
    db.session.commit()
    
    # Registrar no log
    scorer = Player.query.get(scorer_id)
    scorer_name = scorer.name if scorer else 'Desconhecido'
    
    assistant = Player.query.get(assistant_id) if assistant_id else None
    assistant_text = f" (assistência de {assistant.name})" if assistant else ""
    
    log_event(
        'goal', 
        f"Gol do time {'Laranja' if team == 'orange' else 'Preto'}: {scorer_name}{assistant_text}",
        session_id=match.session_id,
        match_id=match_id
    )
    
    return jsonify({
        'success': True, 
        'goal': goal.to_dict(),
        'match': match.to_dict()
    })

@app.route('/api/matches/<int:match_id>/goals/<int:goal_id>', methods=['DELETE'])
@login_required
def remove_goal(match_id, goal_id):
    """API para remover um gol (em caso de erro)."""
    match = Match.query.get_or_404(match_id)
    goal = Goal.query.get_or_404(goal_id)
    
    if goal.match_id != match_id:
        return jsonify({'success': False, 'message': 'Este gol não pertence a esta partida.'}), 400
    
    if not match.is_active:
        return jsonify({'success': False, 'message': 'Esta partida está encerrada.'}), 400
    
    # Atualizar o placar
    if goal.team == 'orange':
        match.orange_score = max(0, match.orange_score - 1)
    else:
        match.black_score = max(0, match.black_score - 1)
    
    # Atualizar gols sofridos pelo goleiro
    opponent_team = 'black' if goal.team == 'orange' else 'orange'
    goalkeeper = PlayerMatch.query.filter_by(
        match_id=match_id, 
        team=opponent_team,
        played_as_goalkeeper=True
    ).first()
    
    if goalkeeper and goalkeeper.goals_conceded > 0:
        goalkeeper.goals_conceded -= 1
    
    # Remover o gol
    db.session.delete(goal)
    db.session.commit()
    
    log_event(
        'goal_deleted', 
        f"Gol removido do time {'Laranja' if goal.team == 'orange' else 'Preto'}",
        session_id=match.session_id,
        match_id=match_id
    )
    
    return jsonify({
        'success': True, 
        'match': match.to_dict()
    })

@app.route('/api/matches/<int:match_id>/players', methods=['PUT'])
@login_required
def update_match_players(match_id):
    """API para atualizar jogadores da partida (para quando alguém sai ou entra durante a partida)."""
    match = Match.query.get_or_404(match_id)
    data = request.json
    
    if not match.is_active:
        return jsonify({'success': False, 'message': 'Esta partida está encerrada.'}), 400
    
    # Remover todos os jogadores atuais
    PlayerMatch.query.filter_by(match_id=match_id).delete()
    
    # Adicionar jogadores atualizados
    orange_players = data.get('orange_team', [])
    black_players = data.get('black_team', [])
    
    for player_data in orange_players:
        player_match = PlayerMatch(
            player_id=player_data['player_id'],
            match_id=match.id,
            team='orange',
            played_as_goalkeeper=player_data.get('is_goalkeeper', False),
            goals_conceded=player_data.get('goals_conceded', 0) if player_data.get('is_goalkeeper', False) else 0
        )
        db.session.add(player_match)
    
    for player_data in black_players:
        player_match = PlayerMatch(
            player_id=player_data['player_id'],
            match_id=match.id,
            team='black',
            played_as_goalkeeper=player_data.get('is_goalkeeper', False),
            goals_conceded=player_data.get('goals_conceded', 0) if player_data.get('is_goalkeeper', False) else 0
        )
        db.session.add(player_match)
    
    db.session.commit()
    
    log_event(
        'players_updated', 
        f"Jogadores da partida atualizados",
        session_id=match.session_id,
        match_id=match_id
    )
    
    return jsonify({'success': True, 'message': 'Jogadores atualizados com sucesso.'})

# ----- APIs de Estatísticas -----

@app.route('/api/stats/top-scorers', methods=['GET'])
def get_top_scorers():
    """API para obter os artilheiros."""
    # Agrupar por jogador e contar gols
    scorers = db.session.query(
        Player.id,
        Player.name,
        func.count(Goal.id).label('goals')
    ).join(
        Goal, Player.id == Goal.scorer_id
    ).group_by(
        Player.id
    ).order_by(
        desc('goals')
    ).all()
    
    result = []
    for scorer in scorers:
        result.append({
            'player_id': scorer.id,
            'name': scorer.name,
            'goals': scorer.goals
        })
    
    return jsonify(result)

@app.route('/api/stats/top-assistants', methods=['GET'])
def get_top_assistants():
    """API para obter os maiores assistentes."""
    # Agrupar por jogador e contar assistências
    assistants = db.session.query(
        Player.id,
        Player.name,
        func.count(Goal.id).label('assists')
    ).join(
        Goal, Player.id == Goal.assistant_id
    ).filter(
        Goal.assistant_id != None
    ).group_by(
        Player.id
    ).order_by(
        desc('assists')
    ).all()
    
    result = []
    for assistant in assistants:
        result.append({
            'player_id': assistant.id,
            'name': assistant.name,
            'assists': assistant.assists
        })
    
    return jsonify(result)

@app.route('/api/stats/top-goalkeepers', methods=['GET'])
def get_top_goalkeepers():
    """API para obter os goleiros com menos gols sofridos por partida."""
    # Subconsulta para contar partidas como goleiro
    goalkeeper_matches = db.session.query(
        PlayerMatch.player_id,
        func.count(PlayerMatch.match_id).label('matches')
    ).filter(
        PlayerMatch.played_as_goalkeeper == True
    ).group_by(
        PlayerMatch.player_id
    ).subquery()
    
    # Subconsulta para somar gols sofridos
    goals_conceded = db.session.query(
        PlayerMatch.player_id,
        func.sum(PlayerMatch.goals_conceded).label('goals_conceded')
    ).filter(
        PlayerMatch.played_as_goalkeeper == True
    ).group_by(
        PlayerMatch.player_id
    ).subquery()
    
    # Consulta principal
    goalkeepers = db.session.query(
        Player.id,
        Player.name,
        goalkeeper_matches.c.matches,
        goals_conceded.c.goals_conceded,
        (goals_conceded.c.goals_conceded / goalkeeper_matches.c.matches).label('average')
    ).join(
        goalkeeper_matches, Player.id == goalkeeper_matches.c.player_id
    ).join(
        goals_conceded, Player.id == goals_conceded.c.player_id
    ).filter(
        goalkeeper_matches.c.matches > 0
    ).order_by(
        'average'
    ).all()
    
    result = []
    for gk in goalkeepers:
        result.append({
            'player_id': gk.id,
            'name': gk.name,
            'matches': gk.matches,
            'goals_conceded': gk.goals_conceded,
            'average': round(gk.average, 2)
        })
    
    return jsonify(result)

@app.route('/api/stats/player/<int:player_id>', methods=['GET'])
def get_player_stats(player_id):
    """API para obter estatísticas detalhadas de um jogador."""
    player = Player.query.get_or_404(player_id)
    
    # Total de partidas
    matches_count = PlayerMatch.query.filter_by(player_id=player_id).count()
    
    # Total de gols
    goals_count = Goal.query.filter_by(scorer_id=player_id).count()
    
    # Total de assistências
    assists_count = Goal.query.filter_by(assistant_id=player_id).count()
    
    # Estatísticas como goleiro
    goalkeeper_matches = PlayerMatch.query.filter_by(
        player_id=player_id, 
        played_as_goalkeeper=True
    ).count()
    
    goals_conceded = db.session.query(
        func.sum(PlayerMatch.goals_conceded)
    ).filter_by(
        player_id=player_id, 
        played_as_goalkeeper=True
    ).scalar() or 0
    
    # Vitórias e derrotas
    wins = 0
    losses = 0
    
    player_matches = PlayerMatch.query.filter_by(player_id=player_id).all()
    for pm in player_matches:
        match = Match.query.get(pm.match_id)
        if match and match.winner_team:
            if match.winner_team == pm.team:
                wins += 1
            else:
                losses += 1
    
    # Montar resultado
    result = {
        'player': player.to_dict(),
        'stats': {
            'matches': matches_count,
            'goals': goals_count,
            'assists': assists_count,
            'goalkeeper_matches': goalkeeper_matches,
            'goals_conceded': goals_conceded,
            'wins': wins,
            'losses': losses,
            'goalkeeper_average': round(goals_conceded / goalkeeper_matches, 2) if goalkeeper_matches > 0 else 0
        }
    }
    
    return jsonify(result)

@app.route('/api/stats/dashboard', methods=['GET'])
def get_dashboard_stats():
    """API para obter estatísticas para o dashboard."""
    # Top artilheiro
    top_scorer = db.session.query(
        Player.id,
        Player.name,
        func.count(Goal.id).label('goals')
    ).join(
        Goal, Player.id == Goal.scorer_id
    ).group_by(
        Player.id
    ).order_by(
        desc('goals')
    ).first()
    
    # Top assistente
    top_assistant = db.session.query(
        Player.id,
        Player.name,
        func.count(Goal.id).label('assists')
    ).join(
        Goal, Player.id == Goal.assistant_id
    ).filter(
        Goal.assistant_id != None
    ).group_by(
        Player.id
    ).order_by(
        desc('assists')
    ).first()
    
    # Melhor goleiro
    goalkeeper_matches = db.session.query(
        PlayerMatch.player_id,
        func.count(PlayerMatch.match_id).label('matches')
    ).filter(
        PlayerMatch.played_as_goalkeeper == True
    ).group_by(
        PlayerMatch.player_id
    ).subquery()
    
    goals_conceded = db.session.query(
        PlayerMatch.player_id,
        func.sum(PlayerMatch.goals_conceded).label('goals_conceded')
    ).filter(
        PlayerMatch.played_as_goalkeeper == True
    ).group_by(
        PlayerMatch.player_id
    ).subquery()
    
    top_goalkeeper = db.session.query(
        Player.id,
        Player.name,
        goalkeeper_matches.c.matches,
        goals_conceded.c.goals_conceded,
        (goals_conceded.c.goals_conceded / goalkeeper_matches.c.matches).label('average')
    ).join(
        goalkeeper_matches, Player.id == goalkeeper_matches.c.player_id
    ).join(
        goals_conceded, Player.id == goals_conceded.c.player_id
    ).filter(
        goalkeeper_matches.c.matches > 0
    ).order_by(
        'average'
    ).first()
    
    # Estatísticas gerais
    total_players = Player.query.count()
    total_sessions = Session.query.count()
    total_matches = Match.query.count()
    total_goals = Goal.query.count()
    
    # Média de gols por partida
    avg_goals_per_match = total_goals / total_matches if total_matches > 0 else 0
    
    result = {
        'top_scorer': {
            'player_id': top_scorer.id,
            'name': top_scorer.name,
            'goals': top_scorer.goals
        } if top_scorer else None,
        
        'top_assistant': {
            'player_id': top_assistant.id,
            'name': top_assistant.name,
            'assists': top_assistant.assists
        } if top_assistant else None,
        
        'top_goalkeeper': {
            'player_id': top_goalkeeper.id,
            'name': top_goalkeeper.name,
            'matches': top_goalkeeper.matches,
            'goals_conceded': top_goalkeeper.goals_conceded,
            'average': round(top_goalkeeper.average, 2)
        } if top_goalkeeper else None,
        
        'total_players': total_players,
        'total_sessions': total_sessions,
        'total_matches': total_matches,
        'total_goals': total_goals,
        'avg_goals_per_match': round(avg_goals_per_match, 2)
    }
    
    return jsonify(result)

@app.route('/api/stats/player_list', methods=['GET'])
def get_player_list_with_stats():
    """API para obter lista de jogadores com suas estatísticas."""
    # Subconsulta para contar gols
    goals = db.session.query(
        Goal.scorer_id,
        func.count(Goal.id).label('goals')
    ).group_by(
        Goal.scorer_id
    ).subquery()
    
    # Subconsulta para contar assistências
    assists = db.session.query(
        Goal.assistant_id,
        func.count(Goal.id).label('assists')
    ).filter(
        Goal.assistant_id != None
    ).group_by(
        Goal.assistant_id
    ).subquery()
    
    # Subconsulta para contar partidas
    matches = db.session.query(
        PlayerMatch.player_id,
        func.count(PlayerMatch.match_id).label('matches')
    ).group_by(
        PlayerMatch.player_id
    ).subquery()
    
    # Subconsulta para gols sofridos como goleiro
    goals_conceded = db.session.query(
        PlayerMatch.player_id,
        func.sum(PlayerMatch.goals_conceded).label('goals_conceded')
    ).filter(
        PlayerMatch.played_as_goalkeeper == True
    ).group_by(
        PlayerMatch.player_id
    ).subquery()
    
    # Subconsulta para domingos participados
    sessions = db.session.query(
        PlayerMatch.player_id,
        func.count(func.distinct(Match.session_id)).label('sessions')
    ).join(
        Match, PlayerMatch.match_id == Match.id
    ).group_by(
        PlayerMatch.player_id
    ).subquery()
    
    # Consulta principal
    players = db.session.query(
        Player.id,
        Player.name,
        Player.is_goalkeeper,
        matches.c.matches,
        goals.c.goals,
        assists.c.assists,
        goals_conceded.c.goals_conceded,
        sessions.c.sessions
    ).outerjoin(
        matches, Player.id == matches.c.player_id
    ).outerjoin(
        goals, Player.id == goals.c.scorer_id
    ).outerjoin(
        assists, Player.id == assists.c.assistant_id
    ).outerjoin(
        goals_conceded, Player.id == goals_conceded.c.player_id
    ).outerjoin(
        sessions, Player.id == sessions.c.player_id
    ).all()
    
    result = []
    for p in players:
        result.append({
            'id': p.id,
            'name': p.name,
            'is_goalkeeper': p.is_goalkeeper,
            'matches': p.matches or 0,
            'goals': p.goals or 0,
            'assists': p.assists or 0,
            'goals_conceded': p.goals_conceded or 0,
            'sessions': p.sessions or 0
        })
    
    return jsonify(result)

# ----- APIs de Configurações -----

@app.route('/api/settings', methods=['GET'])
@login_required
def get_settings():
    """API para obter configurações do sistema."""
    settings = Settings.query.first()
    if not settings:
        return jsonify(None)
    
    return jsonify({
        'match_duration': settings.match_duration
    })

@app.route('/api/settings', methods=['PUT'])
@login_required
def update_settings():
    """API para atualizar configurações do sistema."""
    settings = Settings.query.first()
    if not settings:
        return jsonify({'success': False, 'message': 'Configurações não encontradas.'}), 404

@app.route('/api/settings/reset', methods=['POST'])
@login_required
def reset_database():
    """API para resetar todo o banco de dados."""
    try:
        # Deletar todos os registros de cada tabela
        Goal.query.delete()
        PlayerMatch.query.delete()
        Match.query.delete()
        Session.query.delete()
        Player.query.delete()
        EventLog.query.delete()
        GlobalStats.query.delete()
        
        # Commit as mudanças
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Banco de dados resetado com sucesso!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    
    data = request.json
    
    if 'match_duration' in data:
        settings.match_duration = data['match_duration']
    
    if 'master_password' in data:
        settings.master_password = data['master_password']
    
    settings.updated_at = datetime.now()
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Configurações atualizadas com sucesso!'})

# ----- APIs de Log -----

@app.route('/api/logs', methods=['GET'])
@login_required
def get_logs():
    """API para obter logs de eventos."""
    logs = EventLog.query.order_by(EventLog.timestamp.desc()).limit(100).all()
    return jsonify([log.to_dict() for log in logs])

@app.route('/api/logs/session/<int:session_id>', methods=['GET'])
@login_required
def get_session_logs(session_id):
    """API para obter logs de uma sessão específica."""
    logs = EventLog.query.filter_by(session_id=session_id).order_by(EventLog.timestamp).all()
    return jsonify([log.to_dict() for log in logs])

# ----- APIs de Estatísticas Globais -----

@app.route('/api/stats/global', methods=['GET'])
def get_global_stats():
    """API para obter estatísticas globais."""
    stats = GlobalStats.query.first()
    if not stats:
        return jsonify({
            'orange_wins': 0,
            'black_wins': 0,
            'orange_goals': 0,
            'black_goals': 0,
            'total_sessions': 0,
            'total_matches': 0
        })
    
    return jsonify(stats.to_dict())
