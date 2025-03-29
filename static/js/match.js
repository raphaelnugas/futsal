/**
 * Gerenciamento de Partida - Futsal de Domingo
 * Script responsável pelo gerenciamento de uma partida de futsal
 * 
 * Autor: Raphael Nugas
 * Data: 2023
 */

// Elementos do DOM que serão manipulados
const matchNumberElement = document.getElementById('match-number');
const matchTimerElement = document.getElementById('match-timer');
const startTimerButton = document.getElementById('start-timer-button');
const pauseTimerButton = document.getElementById('pause-timer-button');
const resetTimerButton = document.getElementById('reset-timer-button');
const orangeTeamList = document.getElementById('orange-team-list');
const blackTeamList = document.getElementById('black-team-list');
const orangeScoreElement = document.getElementById('orange-score');
const blackScoreElement = document.getElementById('black-score');
const orangeGoalButton = document.getElementById('orange-goal-button');
const blackGoalButton = document.getElementById('black-goal-button');
const endMatchButton = document.getElementById('end-match-button');
const goalsContainer = document.getElementById('goals-container');
const noGoalsElement = document.getElementById('no-goals');
const goalModal = document.getElementById('goal-modal');
const closeGoalModal = document.getElementById('close-goal-modal');
const goalTeamNameElement = document.getElementById('goal-team-name');
const goalForm = document.getElementById('goal-form');
const goalTeamField = document.getElementById('goal-team');
const goalScorerField = document.getElementById('goal-scorer');
const goalAssistantField = document.getElementById('goal-assistant');
const cancelGoalButton = document.getElementById('cancel-goal');
const endMatchModal = document.getElementById('end-match-modal');
const closeEndMatchModal = document.getElementById('close-end-match-modal');
const resultOrangeScore = document.getElementById('result-orange-score');
const resultBlackScore = document.getElementById('result-black-score');
const winnerText = document.getElementById('winner-text');
const drawResolution = document.getElementById('draw-resolution');
const orangeWonDraw = document.getElementById('orange-won-draw');
const blackWonDraw = document.getElementById('black-won-draw');
const confirmEndMatch = document.getElementById('confirm-end-match');
const cancelEndMatch = document.getElementById('cancel-end-match');
const deleteGoalModal = document.getElementById('delete-goal-modal');
const closeDeleteGoalModal = document.getElementById('close-delete-goal-modal');
const deleteGoalInfo = document.getElementById('delete-goal-info');
const confirmDeleteGoal = document.getElementById('confirm-delete-goal');
const cancelDeleteGoal = document.getElementById('cancel-delete-goal');
const timeUpModal = document.getElementById('time-up-modal');
const closeTimeUpModal = document.getElementById('close-time-up-modal');

// Obter o ID da partida a partir da URL
const urlParts = window.location.pathname.split('/');
const matchId = parseInt(urlParts[urlParts.length - 1]);

// Estado da aplicação
let match = null;
let orangeTeam = [];
let blackTeam = [];
let goals = [];
let settings = null;
let timer = {
    interval: null,
    seconds: 0,
    isRunning: false,
    alarmed: false
};
let goalToDelete = null;
let matchResult = {
    winner: null
};

/**
 * Inicialização
 */
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados
    loadMatchData();
    loadSettings();
    
    // Configurar eventos
    setupEventListeners();
});

/**
 * Configura os listeners de eventos
 */
function setupEventListeners() {
    // Eventos para o cronômetro
    if (startTimerButton) {
        startTimerButton.addEventListener('click', startTimer);
    }
    
    if (pauseTimerButton) {
        pauseTimerButton.addEventListener('click', pauseTimer);
    }
    
    if (resetTimerButton) {
        resetTimerButton.addEventListener('click', resetTimer);
    }
    
    // Eventos para gols
    if (orangeGoalButton) {
        orangeGoalButton.addEventListener('click', () => openGoalModal('orange'));
    }
    
    if (blackGoalButton) {
        blackGoalButton.addEventListener('click', () => openGoalModal('black'));
    }
    
    // Eventos para o modal de gol
    if (closeGoalModal) {
        closeGoalModal.addEventListener('click', () => {
            const bsModal = bootstrap.Modal.getInstance(goalModal);
            if (bsModal) {
                bsModal.hide();
            }
        });
    }
    
    if (cancelGoalButton) {
        cancelGoalButton.addEventListener('click', () => {
            const bsModal = bootstrap.Modal.getInstance(goalModal);
            if (bsModal) {
                bsModal.hide();
            }
        });
    }
    
    if (goalForm) {
        goalForm.addEventListener('submit', handleGoalSubmit);
    }
    
    // Eventos para o modal de encerrar partida
    if (endMatchButton) {
        endMatchButton.addEventListener('click', openEndMatchModal);
    }
    
    if (closeEndMatchModal) {
        closeEndMatchModal.addEventListener('click', () => {
            const bsModal = bootstrap.Modal.getInstance(endMatchModal);
            if (bsModal) {
                bsModal.hide();
            }
        });
    }
    
    if (confirmEndMatch) {
        confirmEndMatch.addEventListener('click', handleEndMatch);
    }
    
    if (cancelEndMatch) {
        cancelEndMatch.addEventListener('click', () => {
            const bsModal = bootstrap.Modal.getInstance(endMatchModal);
            if (bsModal) {
                bsModal.hide();
            }
        });
    }
    
    // Eventos para resolução de empate
    if (orangeWonDraw) {
        orangeWonDraw.addEventListener('click', () => {
            matchResult.winner = 'orange';
            drawResolution.style.display = 'none';
            winnerText.textContent = 'Time Laranja venceu no par ou ímpar!';
            winnerText.className = 'text-orange';
        });
    }
    
    if (blackWonDraw) {
        blackWonDraw.addEventListener('click', () => {
            matchResult.winner = 'black';
            drawResolution.style.display = 'none';
            winnerText.textContent = 'Time Preto venceu no par ou ímpar!';
            winnerText.className = 'text-black';
        });
    }
    
    // Eventos para o modal de excluir gol
    if (closeDeleteGoalModal) {
        closeDeleteGoalModal.addEventListener('click', () => {
            const bsModal = bootstrap.Modal.getInstance(deleteGoalModal);
            if (bsModal) {
                bsModal.hide();
            }
        });
    }
    
    if (confirmDeleteGoal) {
        confirmDeleteGoal.addEventListener('click', handleDeleteGoal);
    }
    
    if (cancelDeleteGoal) {
        cancelDeleteGoal.addEventListener('click', () => {
            const bsModal = bootstrap.Modal.getInstance(deleteGoalModal);
            if (bsModal) {
                bsModal.hide();
            }
        });
    }
    
    // Evento para o modal de tempo esgotado
    if (closeTimeUpModal) {
        closeTimeUpModal.addEventListener('click', () => {
            const bsModal = bootstrap.Modal.getInstance(timeUpModal);
            if (bsModal) {
                bsModal.hide();
            }
        });
    }
    
    // Modais Bootstrap fecham automaticamente ao clicar fora
    
    // Confirmar antes de deixar a página se o timer estiver rodando
    window.addEventListener('beforeunload', (event) => {
        if (timer.isRunning) {
            event.preventDefault();
            return (event.returnValue = 'A partida está em andamento. Deseja realmente sair?');
        }
    });
}

/**
 * Carrega os dados da partida
 */
async function loadMatchData() {
    try {
        showLoading(true);
        
        // Carregar dados da partida
        const response = await fetch(`/api/matches/${matchId}`);
        const data = await response.json();
        
        // Guardar dados
        match = data.match;
        orangeTeam = data.orange_team;
        blackTeam = data.black_team;
        goals = data.goals;
        
        // Atualizar interface
        updateMatchInterface();
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar dados da partida:', error);
        showError('Não foi possível carregar os dados da partida.');
        showLoading(false);
    }
}

/**
 * Carrega as configurações do sistema
 */
async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        settings = await response.json();
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        settings = { match_duration: 10 }; // Padrão de 10 minutos
    }
}

/**
 * Atualiza a interface com os dados da partida
 */
function updateMatchInterface() {
    // Atualizar número da partida
    if (matchNumberElement) {
        matchNumberElement.textContent = match.match_number;
    }
    
    // Atualizar placar
    updateScore();
    
    // Atualizar times
    updateTeams();
    
    // Atualizar gols
    updateGoals();
    
    // Verificar se a partida está ativa
    if (!match.is_active) {
        disableMatchControls();
    }
}

/**
 * Atualiza o placar
 */
function updateScore() {
    if (orangeScoreElement) {
        orangeScoreElement.textContent = match.orange_score;
    }
    
    if (blackScoreElement) {
        blackScoreElement.textContent = match.black_score;
    }
}

/**
 * Atualiza os times
 */
function updateTeams() {
    if (!orangeTeamList || !blackTeamList) return;
    
    // Limpar listas
    orangeTeamList.innerHTML = '';
    blackTeamList.innerHTML = '';
    
    // Preencher time laranja
    orangeTeam.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        playerItem.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="player-avatar mr-2">${getInitials(player.name)}</div>
                <div class="player-name">
                    ${player.name}
                    ${player.is_goalkeeper ? '<span class="badge badge-blue ml-1">Goleiro</span>' : ''}
                </div>
            </div>
        `;
        orangeTeamList.appendChild(playerItem);
    });
    
    // Preencher time preto
    blackTeam.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        playerItem.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="player-avatar mr-2">${getInitials(player.name)}</div>
                <div class="player-name">
                    ${player.name}
                    ${player.is_goalkeeper ? '<span class="badge badge-blue ml-1">Goleiro</span>' : ''}
                </div>
            </div>
        `;
        blackTeamList.appendChild(playerItem);
    });
}

/**
 * Atualiza a lista de gols
 */
function updateGoals() {
    if (!goalsContainer || !noGoalsElement) return;
    
    if (goals.length === 0) {
        goalsContainer.innerHTML = '';
        noGoalsElement.style.display = 'block';
        return;
    }
    
    noGoalsElement.style.display = 'none';
    goalsContainer.innerHTML = '';
    
    // Ordenar gols por tempo (mais recentes por último)
    const sortedGoals = [...goals].sort((a, b) => 
        new Date(a.time) - new Date(b.time)
    );
    
    // Criar item para cada gol
    sortedGoals.forEach(goal => {
        const goalItem = document.createElement('div');
        goalItem.className = `alert ${goal.team === 'orange' ? 'alert-warning' : 'alert-dark'} mb-2`;
        
        // Informações do gol
        const goalTime = new Date(goal.time);
        const timeString = `${goalTime.getHours().toString().padStart(2, '0')}:${goalTime.getMinutes().toString().padStart(2, '0')}`;
        
        goalItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${goal.team === 'orange' ? 'Time Laranja' : 'Time Preto'}</strong>
                    <span class="mx-1">-</span>
                    ${goal.scorer_name}
                    ${goal.assistant_name ? `<small>(Assist: ${goal.assistant_name})</small>` : ''}
                </div>
                <div class="d-flex align-items-center">
                    <small class="text-muted mr-2">${timeString}</small>
                    ${match.is_active ? `
                        <button class="btn btn-sm btn-danger delete-goal-btn" data-goal-id="${goal.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        goalsContainer.appendChild(goalItem);
        
        // Adicionar evento ao botão de excluir
        const deleteButton = goalItem.querySelector('.delete-goal-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => openDeleteGoalModal(goal));
        }
    });
}

/**
 * Inicia o cronômetro
 */
function startTimer() {
    if (timer.isRunning) return;
    
    // Desabilitar botão de iniciar
    if (startTimerButton) {
        startTimerButton.disabled = true;
    }
    
    // Iniciar o intervalo
    timer.isRunning = true;
    timer.interval = setInterval(() => {
        timer.seconds++;
        
        // Atualizar o mostrador
        if (matchTimerElement) {
            matchTimerElement.textContent = formatTime(timer.seconds);
        }
        
        // Verificar se atingiu o tempo regulamentar
        const matchDuration = settings?.match_duration || 10;
        if (timer.seconds >= matchDuration * 60 && !timer.alarmed) {
            playAlarm();
            timer.alarmed = true;
            
            // Abrir o modal usando Bootstrap
            const timeUpModalBootstrap = new bootstrap.Modal(document.getElementById('time-up-modal'));
            timeUpModalBootstrap.show();
        }
    }, 1000);
}

/**
 * Pausa o cronômetro
 */
function pauseTimer() {
    if (!timer.isRunning) return;
    
    // Habilitar botão de iniciar se existir
    if (startTimerButton) {
        startTimerButton.disabled = false;
    }
    
    // Parar o intervalo
    clearInterval(timer.interval);
    timer.isRunning = false;
}

/**
 * Reinicia o cronômetro
 */
function resetTimer() {
    // Parar o cronômetro se estiver rodando
    if (timer.isRunning) {
        pauseTimer();
    }
    
    // Resetar valores
    timer.seconds = 0;
    timer.alarmed = false;
    
    // Atualizar o mostrador
    if (matchTimerElement) {
        matchTimerElement.textContent = formatTime(timer.seconds);
    }
    
    // Resetar botão de iniciar se existir
    if (startTimerButton) {
        startTimerButton.disabled = false;
    }
}

/**
 * Abre o modal para marcar um gol
 */
function openGoalModal(team) {
    if (!goalModal || !goalTeamNameElement || !goalTeamField || !goalScorerField || !goalAssistantField) return;
    
    // Definir o time
    goalTeamField.value = team;
    goalTeamNameElement.textContent = team === 'orange' ? 'Time Laranja' : 'Time Preto';
    
    // Resetar campos
    goalScorerField.innerHTML = '<option value="">-- Selecione o Jogador --</option>';
    goalAssistantField.innerHTML = '<option value="">-- Sem Assistência --</option>';
    
    // Preencher opções de jogador que marcou
    const teamPlayers = team === 'orange' ? orangeTeam : blackTeam;
    teamPlayers.forEach(player => {
        const option = document.createElement('option');
        option.value = player.player_id;
        option.textContent = player.name;
        goalScorerField.appendChild(option);
    });
    
    // Preencher opções de assistência (pode ser qualquer jogador do mesmo time)
    teamPlayers.forEach(player => {
        const option = document.createElement('option');
        option.value = player.player_id;
        option.textContent = player.name;
        goalAssistantField.appendChild(option);
    });
    
    // Abrir o modal usando Bootstrap
    const goalModalBootstrap = new bootstrap.Modal(goalModal);
    goalModalBootstrap.show();
}

/**
 * Manipula o envio do formulário de gol
 */
async function handleGoalSubmit(event) {
    event.preventDefault();
    
    const team = goalTeamField.value;
    const scorerId = parseInt(goalScorerField.value);
    const assistantId = goalAssistantField.value ? parseInt(goalAssistantField.value) : null;
    
    if (!team || !scorerId) {
        showError('Selecione o jogador que marcou o gol.');
        return;
    }
    
    if (scorerId === assistantId) {
        showError('O jogador não pode dar assistência para si mesmo.');
        return;
    }
    
    try {
        showLoading(true);
        
        // Fechar o modal usando Bootstrap
        const bsModal = bootstrap.Modal.getInstance(goalModal);
        if (bsModal) {
            bsModal.hide();
        }
        
        const response = await fetch(`/api/matches/${matchId}/goals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                team,
                scorer_id: scorerId,
                assistant_id: assistantId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Atualizar dados da partida
            match = data.match;
            
            // Adicionar o novo gol à lista
            goals.push(data.goal);
            
            // Atualizar interface
            updateScore();
            updateGoals();
        } else {
            showError(data.message || 'Erro ao registrar gol.');
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao registrar gol:', error);
        showError('Erro ao conectar com o servidor. Tente novamente.');
        showLoading(false);
    }
}

/**
 * Abre o modal para confirmar exclusão de um gol
 */
function openDeleteGoalModal(goal) {
    if (!deleteGoalModal || !deleteGoalInfo) return;
    
    // Guardar referência ao gol
    goalToDelete = goal;
    
    // Preencher informações
    const teamName = goal.team === 'orange' ? 'Time Laranja' : 'Time Preto';
    deleteGoalInfo.textContent = `${teamName}: gol de ${goal.scorer_name}${goal.assistant_name ? ` (assist: ${goal.assistant_name})` : ''}`;
    
    // Abrir o modal usando Bootstrap
    const deleteGoalModalBootstrap = new bootstrap.Modal(deleteGoalModal);
    deleteGoalModalBootstrap.show();
}

/**
 * Manipula a exclusão de um gol
 */
async function handleDeleteGoal() {
    if (!goalToDelete) {
        showError('Nenhum gol selecionado para exclusão.');
        return;
    }
    
    try {
        showLoading(true);
        
        // Fechar o modal usando Bootstrap
        const bsModal = bootstrap.Modal.getInstance(deleteGoalModal);
        if (bsModal) {
            bsModal.hide();
        }
        
        const response = await fetch(`/api/matches/${matchId}/goals/${goalToDelete.id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Atualizar dados da partida
            match = data.match;
            
            // Remover o gol da lista
            goals = goals.filter(g => g.id !== goalToDelete.id);
            
            // Atualizar interface
            updateScore();
            updateGoals();
            
            showSuccess('Gol removido com sucesso!');
        } else {
            showError(data.message || 'Erro ao remover gol.');
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao remover gol:', error);
        showError('Erro ao conectar com o servidor. Tente novamente.');
        showLoading(false);
    } finally {
        goalToDelete = null;
    }
}

/**
 * Abre o modal de encerramento de partida
 */
function openEndMatchModal() {
    if (!endMatchModal || !resultOrangeScore || !resultBlackScore || !winnerText || !drawResolution) return;
    
    // Preencher placar
    resultOrangeScore.textContent = match.orange_score;
    resultBlackScore.textContent = match.black_score;
    
    // Determinar vencedor
    if (match.orange_score > match.black_score) {
        winnerText.textContent = 'Time Laranja venceu!';
        winnerText.className = 'text-orange';
        matchResult.winner = 'orange';
        drawResolution.style.display = 'none';
    } else if (match.black_score > match.orange_score) {
        winnerText.textContent = 'Time Preto venceu!';
        winnerText.className = 'text-black';
        matchResult.winner = 'black';
        drawResolution.style.display = 'none';
    } else {
        // Empate
        winnerText.textContent = 'Empate!';
        winnerText.className = '';
        matchResult.winner = null;
        
        // Mostrar opção de par ou ímpar
        drawResolution.style.display = 'block';
    }
    
    // Abrir o modal usando Bootstrap
    const endMatchModalBootstrap = new bootstrap.Modal(endMatchModal);
    endMatchModalBootstrap.show();
}

/**
 * Manipula o encerramento da partida
 */
async function handleEndMatch() {
    if (matchResult.winner === null && drawResolution.style.display !== 'none') {
        showError('Selecione o vencedor do par ou ímpar.');
        return;
    }
    
    try {
        showLoading(true);
        
        // Fechar o modal usando Bootstrap
        const bsModal = bootstrap.Modal.getInstance(endMatchModal);
        if (bsModal) {
            bsModal.hide();
        }
        
        // Parar o cronômetro se estiver rodando
        if (timer.isRunning) {
            pauseTimer();
        }
        
        // Verificar e garantir que winner_team seja uma string ou null
        let winnerTeam = matchResult.winner;
        console.log("Enviando winner_team:", winnerTeam);
        
        const response = await fetch(`/api/matches/${matchId}/end`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                winner_team: winnerTeam
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Atualizar dados da partida
            match = data.match;
            
            // Desabilitar controles
            disableMatchControls();
            
            showSuccess('Partida encerrada com sucesso!');
            
            // Redirecionar para a página da sessão após 2 segundos
            setTimeout(() => {
                window.location.href = `/session/${match.session_id}`;
            }, 2000);
        } else {
            showError(data.message || 'Erro ao encerrar partida.');
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao encerrar partida:', error);
        showError('Erro ao conectar com o servidor. Tente novamente.');
        showLoading(false);
    }
}

/**
 * Desabilita os controles da partida (quando encerrada)
 */
function disableMatchControls() {
    // Desabilitar botão de iniciar
    if (startTimerButton) {
        startTimerButton.disabled = true;
    }
    
    // Desabilitar botões de gol
    if (orangeGoalButton) {
        orangeGoalButton.disabled = true;
    }
    
    if (blackGoalButton) {
        blackGoalButton.disabled = true;
    }
    
    // Desabilitar botão de encerrar
    if (endMatchButton) {
        endMatchButton.disabled = true;
    }
    
    // Remover botões de excluir gol
    const deleteButtons = document.querySelectorAll('.delete-goal-btn');
    deleteButtons.forEach(button => button.remove());
    
    // Adicionar aviso de partida encerrada
    const matchTimerContainer = document.querySelector('.match-timer-container');
    if (matchTimerContainer) {
        const endedAlert = document.createElement('div');
        endedAlert.className = 'alert alert-warning text-center mt-3';
        endedAlert.textContent = 'Esta partida já está encerrada.';
        matchTimerContainer.appendChild(endedAlert);
    }
}
