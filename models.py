from datetime import datetime
from app import db

# Modelo para jogadores
class Player(db.Model):
    """
    Modelo que representa um jogador de futsal.
    Armazena informações básicas do jogador e se ele é goleiro.
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    is_goalkeeper = db.Column(db.Boolean, default=False)
    photo_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relacionamentos
    goals = db.relationship('Goal', backref='scorer', lazy=True, foreign_keys='Goal.scorer_id')
    assists = db.relationship('Goal', backref='assistant', lazy=True, foreign_keys='Goal.assistant_id')
    participations = db.relationship('PlayerMatch', backref='player', lazy=True)
    
    def to_dict(self):
        """Converte o objeto Player para um dicionário."""
        return {
            'id': self.id,
            'name': self.name,
            'is_goalkeeper': self.is_goalkeeper,
            'photo_url': self.photo_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Modelo para sessões (domingos)
class Session(db.Model):
    """
    Modelo que representa uma sessão de domingo.
    Cada sessão contém múltiplas partidas.
    """
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, unique=True)
    start_time = db.Column(db.DateTime, nullable=True)
    end_time = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # Relacionamentos
    matches = db.relationship('Match', backref='session', lazy=True)
    
    def to_dict(self):
        """Converte o objeto Session para um dicionário."""
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'match_count': len(self.matches) if self.matches else 0
        }

# Modelo para partidas
class Match(db.Model):
    """
    Modelo que representa uma partida individual.
    Cada partida tem dois times (Laranja e Preto) e estatísticas associadas.
    """
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=True)
    end_time = db.Column(db.DateTime, nullable=True)
    orange_score = db.Column(db.Integer, default=0)
    black_score = db.Column(db.Integer, default=0)
    winner_team = db.Column(db.String(10), nullable=True)  # 'orange', 'black', ou None para empate
    is_active = db.Column(db.Boolean, default=True)
    match_number = db.Column(db.Integer, default=1)  # Número da partida na sessão
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # Relacionamentos
    player_matches = db.relationship('PlayerMatch', backref='match', lazy=True)
    goals = db.relationship('Goal', backref='match', lazy=True)
    
    def to_dict(self):
        """Converte o objeto Match para um dicionário."""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'orange_score': self.orange_score,
            'black_score': self.black_score,
            'winner_team': self.winner_team,
            'is_active': self.is_active,
            'match_number': self.match_number,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Tabela de relação entre jogadores e partidas
class PlayerMatch(db.Model):
    """
    Modelo que relaciona jogadores com partidas.
    Registra qual time (Laranja ou Preto) o jogador estava.
    """
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    match_id = db.Column(db.Integer, db.ForeignKey('match.id'), nullable=False)
    team = db.Column(db.String(10), nullable=False)  # 'orange' ou 'black'
    played_as_goalkeeper = db.Column(db.Boolean, default=False)
    goals_conceded = db.Column(db.Integer, default=0)  # Apenas para goleiros
    
    def to_dict(self):
        """Converte o objeto PlayerMatch para um dicionário."""
        return {
            'id': self.id,
            'player_id': self.player_id,
            'match_id': self.match_id,
            'team': self.team,
            'played_as_goalkeeper': self.played_as_goalkeeper,
            'goals_conceded': self.goals_conceded
        }

# Modelo para gols
class Goal(db.Model):
    """
    Modelo que representa um gol marcado em uma partida.
    Registra quem marcou, assistiu e sofreu o gol.
    """
    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey('match.id'), nullable=False)
    scorer_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    assistant_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=True)  # Opcional
    team = db.Column(db.String(10), nullable=False)  # 'orange' ou 'black'
    time = db.Column(db.DateTime, default=datetime.now)
    
    def to_dict(self):
        """Converte o objeto Goal para um dicionário."""
        return {
            'id': self.id,
            'match_id': self.match_id,
            'scorer_id': self.scorer_id,
            'assistant_id': self.assistant_id,
            'team': self.team,
            'time': self.time.isoformat() if self.time else None
        }

# Modelo para configurações
class Settings(db.Model):
    """
    Modelo que armazena configurações do sistema.
    """
    id = db.Column(db.Integer, primary_key=True)
    match_duration = db.Column(db.Integer, default=10)  # Em minutos
    master_password = db.Column(db.String(50), default="nautico2025")
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def to_dict(self):
        """Converte o objeto Settings para um dicionário."""
        return {
            'id': self.id,
            'match_duration': self.match_duration,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Modelo para logs de eventos
class EventLog(db.Model):
    """
    Modelo que armazena logs de eventos importantes no sistema.
    """
    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(50), nullable=False)  # 'session_start', 'session_end', 'match_start', 'match_end', 'goal'
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'), nullable=True)
    match_id = db.Column(db.Integer, db.ForeignKey('match.id'), nullable=True)
    description = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.now)
    
    def to_dict(self):
        """Converte o objeto EventLog para um dicionário."""
        return {
            'id': self.id,
            'event_type': self.event_type,
            'session_id': self.session_id,
            'match_id': self.match_id,
            'description': self.description,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

# Modelo para estatísticas globais (bônus)
class GlobalStats(db.Model):
    """
    Modelo que armazena estatísticas globais cumulativas.
    """
    id = db.Column(db.Integer, primary_key=True)
    orange_wins = db.Column(db.Integer, default=0)
    black_wins = db.Column(db.Integer, default=0)
    orange_goals = db.Column(db.Integer, default=0)
    black_goals = db.Column(db.Integer, default=0)
    total_sessions = db.Column(db.Integer, default=0)
    total_matches = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def to_dict(self):
        """Converte o objeto GlobalStats para um dicionário."""
        return {
            'id': self.id,
            'orange_wins': self.orange_wins,
            'black_wins': self.black_wins,
            'orange_goals': self.orange_goals,
            'black_goals': self.black_goals,
            'total_sessions': self.total_sessions,
            'total_matches': self.total_matches,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
