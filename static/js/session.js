/**
 * Gerenciamento de Sessão - Futsal de Domingo
 * Script responsável pelo gerenciamento de uma sessão de domingo
 * 
 * Autor: Raphael Nugas
 * Data: 2023
 */

// Elementos do DOM que serão manipulados
const sessionDateElement = document.getElementById('session-date');
const sessionStatusElement = document.getElementById('session-status');
const arrivalBoardContainer = document.getElementById('arrival-board-container');
const teamsContainer = document.getElementById('teams-container');
const waitingPlayersContainer = document.getElementById('waiting-players-container');
const matchesContainer = document.getElementById('matches-container');
const noMatchesElement = document.getElementById('no-matches');
const arrivalPlayerSelect = document.getElementById('arrival-player-select');
const addArrivalButton = document.getElementById('add-arrival-button');
const arrivalList = document.getElementById('arrival-list');
const arrivalCountElement = document.getElementById('arrival-count');
const drawTeamsButton = document.getElementById('draw-teams-button');
const drawTeamsModal = document.getElementById('draw-teams-modal');
const closeDrawTeamsModal = document.getElementById('close-draw-teams-modal');
const executeDrawButton = document.getElementById('execute-draw');
const confirmDrawButton = document.getElementById('confirm-draw');
const cancelDrawButton = document.getElementById('cancel-draw');
const drawResultContainer = document.getElementById('draw-result-container');
const drawOrangeTeamElement = document.getElementById('draw-orange-team');
const drawBlackTeamElement = document.getElementById('draw-black-team');
const orangeTeamBoard = document.getElementById('orange-team-board');
const blackTeamBoard = document.getElementById('black-team-board');
const orangeTeamContainer = document.getElementById('orange-team-container');
const blackTeamContainer = document.getElementById('black-team-container');
const orangeVictoryCount = document.getElementById('orange-victory-count');
const blackVictoryCount = document.getElementById('black-victory-count');
const startMatchButton = document.getElementById('start-match-button');
const editTeamsModal = document.getElementById('edit-teams-modal');
const closeEditTeamsModal = document.getElementById('close-edit-teams-modal');
const orangeGoalkeeperSelect = document.getElementById('orange-goalkeeper-select');
const blackGoalkeeperSelect = document.getElementById('black-goalkeeper-select');
const orangePlayersSelect = document.getElementById('orange-players-select');
const blackPlayersSelect = document.getElementById('black-players-select');
const saveTeamsButton = document.getElementById('save-teams');
const cancelEditTeams = document.getElementById('cancel-edit-teams');
const endSessionButton = document.getElementById('end-session-button');
const endSessionConfirmModal = document.getElementById('end-session-confirm-modal');
const closeEndSessionModal = document.getElementById('close-end-session-modal');
const confirmEndSession = document.getElementById('confirm-end-session');
const cancelEndSession = document.getElementById('cancel-end-session');
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

// Estado da aplicação
let sessionData = null;
let sessionDate = null;
let arrivalPlayers = [];
let waitingPlayers = [];
let orangeTeam = [];
let blackTeam = [];
let allPlayers = [];
let matches = [];
let activeMatch = null;
let orangeWins = 0;
let blackWins = 0;
let matchResult = {
    matchId: null,
    winner: null
};

/**
 * Inicialização
 */
document.addEventListener('DOMContentLoaded', () => {
    // Obter a data da sessão a partir da URL
    const urlParts = window.location.pathname.split('/');
    sessionDate = urlParts[urlParts.length - 1];
    
    if (sessionDateElement) {
        sessionDateElement.textContent = formatDate(sessionDate);
    }
    
    // Carregar dados
    loadSessionData();
    
    // Configurar eventos
    setupEventListeners();
});

/**
 * Configura os listeners de eventos
 */
function setupEventListeners() {
    // Evento para adicionar jogador ao quadro de chegada
    if (addArrivalButton) {
        addArrivalButton.addEventListener('click', addPlayerToArrival);
    }
    
    // Evento para sortear times
    if (drawTeamsButton) {
        drawTeamsButton.addEventListener('click', () => openDrawTeamsModal());
    }
    
    // Eventos para o modal de sorteio
    if (executeDrawButton) {
        executeDrawButton.addEventListener('click', executeTeamsDraw);
    }
    
    if (confirmDrawButton) {
        confirmDrawButton.addEventListener('click', confirmDraw);
    }
    
    // Botão para sortear/randomizar times
    const randomizeTeamsButton = document.getElementById('randomize-teams-button');
    if (randomizeTeamsButton) {
        randomizeTeamsButton.addEventListener('click', randomizeTeams);
    }
    
    // Evento para iniciar partida
    if (startMatchButton) {
        startMatchButton.addEventListener('click', startMatch);
    }
    
    // Configurar drag-and-drop para os jogadores
    setupDragAndDrop();
    
    // Eventos para encerrar sessão
    if (endSessionButton) {
        endSessionButton.addEventListener('click', () => toggleModal('end-session-confirm-modal', true));
    }
    
    if (confirmEndSession) {
        confirmEndSession.addEventListener('click', endSession);
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
    
    // Eventos para modal de fim de partida
    if (confirmEndMatch) {
        confirmEndMatch.addEventListener('click', confirmMatchEnd);
    }
}

/**
 * Carrega os dados da sessão
 */
async function loadSessionData() {
    try {
        showLoading(true);
        
        // Carregar dados da sessão
        const sessionResponse = await fetch(`/api/sessions/${sessionDate}`);
        sessionData = await sessionResponse.json();
        
        // Se não há sessão para esta data, mostrar mensagem
        if (!sessionData) {
            sessionStatusElement.innerHTML = `
                <div class="alert alert-warning">
                    <h5>Nenhuma sessão encontrada para esta data.</h5>
                    <p>Retorne ao calendário para criar uma sessão para ${formatDate(sessionDate)}.</p>
                    <a href="/sessions" class="btn btn-primary">Voltar ao Calendário</a>
                </div>
            `;
            showLoading(false);
            return;
        }
        
        // Carregar jogadores
        const playersResponse = await fetch('/api/players');
        allPlayers = await playersResponse.json();
        
        // Carregar partidas da sessão
        if (sessionData.id) {
            const matchesResponse = await fetch(`/api/sessions/${sessionData.id}/matches`);
            matches = await matchesResponse.json();
            
            // Verificar se há partida ativa
            activeMatch = matches.find(m => m.is_active);
        }
        
        // Atualizar interface
        updateSessionInterface();
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar dados da sessão:', error);
        showError('Não foi possível carregar os dados da sessão.');
        showLoading(false);
    }
}

/**
 * Atualiza a interface com os dados da sessão
 */
function updateSessionInterface() {
    // Atualizar status da sessão
    updateSessionStatus();
    
    // Preparar quadro de chegada ou times
    if (sessionData.is_active) {
        if (activeMatch) {
            setupTeamsView();
            updateMatchesView();
        } else if (matches.length > 0) {
            // Houve partidas, mas nenhuma ativa
            const lastMatch = matches[matches.length - 1];
            setupTeamsFromLastMatch(lastMatch);
            updateMatchesView();
        } else {
            // Sessão iniciada, mas sem partidas
            setupArrivalBoard();
        }
    } else {
        // Sessão encerrada
        updateMatchesView();
    }
}

/**
 * Atualiza o status da sessão
 */
function updateSessionStatus() {
    if (!sessionStatusElement) return;
    
    let statusHtml = '';
    
    if (sessionData.is_active) {
        statusHtml = `
            <div class="alert alert-success">
                <h5>Sessão Ativa</h5>
                <p>Iniciada em: ${formatDate(sessionData.start_time, true)}</p>
                <p>Partidas: ${matches.length}</p>
            </div>
        `;
        
        // Mostrar botão de encerrar sessão
        if (endSessionButton) {
            endSessionButton.style.display = 'inline-block';
        }
    } else {
        statusHtml = `
            <div class="alert alert-secondary">
                <h5>Sessão Encerrada</h5>
                <p>Iniciada em: ${formatDate(sessionData.start_time, true)}</p>
                <p>Encerrada em: ${formatDate(sessionData.end_time, true)}</p>
                <p>Partidas realizadas: ${matches.length}</p>
            </div>
        `;
        
        // Esconder botão de encerrar sessão
        if (endSessionButton) {
            endSessionButton.style.display = 'none';
        }
    }
    
    sessionStatusElement.innerHTML = statusHtml;
}

/**
 * Configura o quadro de chegada
 */
function setupArrivalBoard() {
    if (!arrivalBoardContainer || !arrivalPlayerSelect) return;
    
    // Mostrar o quadro de chegada
    arrivalBoardContainer.style.display = 'block';
    teamsContainer.style.display = 'none';
    waitingPlayersContainer.style.display = 'none';
    
    // Preencher o seletor de jogadores
    arrivalPlayerSelect.innerHTML = '<option value="">-- Selecione o jogador --</option>';
    
    allPlayers.forEach(player => {
        // Verificar se o jogador já está no quadro
        if (!arrivalPlayers.find(p => p.id === player.id)) {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.name + (player.is_goalkeeper ? ' (Goleiro)' : '');
            arrivalPlayerSelect.appendChild(option);
        }
    });
    
    // Atualizar lista de jogadores no quadro
    updateArrivalList();
}

/**
 * Atualiza a lista de jogadores no quadro de chegada
 */
function updateArrivalList() {
    if (!arrivalList || !arrivalCountElement) return;
    
    arrivalList.innerHTML = '';
    arrivalCountElement.textContent = arrivalPlayers.length;
    
    // Habilitar/desabilitar botão de sorteio
    if (drawTeamsButton) {
        drawTeamsButton.disabled = arrivalPlayers.length < 10;
    }
    
    // Adicionar cada jogador à lista
    arrivalPlayers.forEach((player, index) => {
        const li = document.createElement('li');
        li.className = 'arrival-item';
        
        li.innerHTML = `
            <div class="arrival-number">${index + 1}</div>
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                ${player.is_goalkeeper ? '<span class="goalkeeper-badge">Goleiro</span>' : ''}
            </div>
            <button class="btn btn-sm btn-danger remove-arrival-btn" data-player-id="${player.id}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        arrivalList.appendChild(li);
        
        // Adicionar evento ao botão de remover
        const removeButton = li.querySelector('.remove-arrival-btn');
        if (removeButton) {
            removeButton.addEventListener('click', () => removePlayerFromArrival(player.id));
        }
    });
}

/**
 * Adiciona um jogador ao quadro de chegada
 */
function addPlayerToArrival() {
    if (!arrivalPlayerSelect) return;
    
    const playerId = parseInt(arrivalPlayerSelect.value);
    
    if (!playerId) {
        showError('Selecione um jogador.');
        return;
    }
    
    // Encontrar o jogador na lista completa
    const player = allPlayers.find(p => p.id === playerId);
    
    if (!player) {
        showError('Jogador não encontrado.');
        return;
    }
    
    // Adicionar à lista de chegada
    arrivalPlayers.push(player);
    
    // Atualizar interface
    updateArrivalList();
    
    // Limpar seleção
    arrivalPlayerSelect.value = '';
    
    // Recarregar opções do select (remover o jogador adicionado)
    setupArrivalBoard();
}

/**
 * Remove um jogador do quadro de chegada
 */
function removePlayerFromArrival(playerId) {
    // Remover jogador da lista
    arrivalPlayers = arrivalPlayers.filter(player => player.id !== playerId);
    
    // Atualizar interface
    updateArrivalList();
    
    // Recarregar opções do select (adicionar o jogador removido)
    setupArrivalBoard();
}

/**
 * Abre o modal de sorteio de times
 */
function openDrawTeamsModal() {
    if (arrivalPlayers.length < 10) {
        showError('São necessários pelo menos 10 jogadores para iniciar uma partida.');
        return;
    }
    
    // Resetar o modal
    if (drawResultContainer) {
        drawResultContainer.style.display = 'none';
    }
    
    if (executeDrawButton) {
        executeDrawButton.style.display = 'inline-block';
    }
    
    if (confirmDrawButton) {
        confirmDrawButton.style.display = 'none';
    }
    
    // Abrir o modal usando Bootstrap
    const drawTeamsModal = new bootstrap.Modal(document.getElementById('draw-teams-modal'));
    drawTeamsModal.show();
}

/**
 * Executa o sorteio de times
 */
function executeTeamsDraw() {
    // Separar goleiros e jogadores de linha
    const goalkeepers = arrivalPlayers.filter(p => p.is_goalkeeper);
    const fieldPlayers = arrivalPlayers.filter(p => !p.is_goalkeeper);
    
    // Embaralhar os arrays
    const shuffledGoalkeepers = shuffleArray(goalkeepers);
    const shuffledFieldPlayers = shuffleArray(fieldPlayers);
    
    // Distribuir goleiros
    orangeTeam = [];
    blackTeam = [];
    
    if (shuffledGoalkeepers.length >= 2) {
        // Dois ou mais goleiros disponíveis
        orangeTeam.push({ ...shuffledGoalkeepers[0], played_as_goalkeeper: true });
        blackTeam.push({ ...shuffledGoalkeepers[1], played_as_goalkeeper: true });
        
        // Adicionar goleiros excedentes como jogadores de linha
        for (let i = 2; i < shuffledGoalkeepers.length; i++) {
            shuffledFieldPlayers.push({ ...shuffledGoalkeepers[i], played_as_goalkeeper: false });
        }
    } else if (shuffledGoalkeepers.length === 1) {
        // Apenas um goleiro disponível
        orangeTeam.push({ ...shuffledGoalkeepers[0], played_as_goalkeeper: true });
        
        // Usar jogador de linha como goleiro
        if (shuffledFieldPlayers.length > 0) {
            blackTeam.push({ ...shuffledFieldPlayers.shift(), played_as_goalkeeper: true });
        }
    } else {
        // Nenhum goleiro disponível
        if (shuffledFieldPlayers.length >= 2) {
            orangeTeam.push({ ...shuffledFieldPlayers.shift(), played_as_goalkeeper: true });
            blackTeam.push({ ...shuffledFieldPlayers.shift(), played_as_goalkeeper: true });
        }
    }
    
    // Distribuir jogadores de linha (4 para cada time)
    const remainingPlayers = Math.min(8, shuffledFieldPlayers.length);
    
    for (let i = 0; i < remainingPlayers; i++) {
        const player = { ...shuffledFieldPlayers[i], played_as_goalkeeper: false };
        
        if (i % 2 === 0) {
            orangeTeam.push(player);
        } else {
            blackTeam.push(player);
        }
    }
    
    // Jogadores que ficaram de fora
    waitingPlayers = [
        ...shuffledFieldPlayers.slice(remainingPlayers),
        ...arrivalPlayers.filter(p => {
            return !orangeTeam.find(op => op.id === p.id) && 
                   !blackTeam.find(bp => bp.id === p.id);
        })
    ];
    
    // Exibir resultado do sorteio
    displayDrawResult();
}

/**
 * Exibe o resultado do sorteio
 */
function displayDrawResult() {
    if (!drawResultContainer || !drawOrangeTeamElement || !drawBlackTeamElement) return;
    
    // Mostrar o container de resultado
    drawResultContainer.style.display = 'block';
    
    // Esconder botão de executar e mostrar botão de confirmar
    if (executeDrawButton) {
        executeDrawButton.style.display = 'none';
    }
    
    if (confirmDrawButton) {
        confirmDrawButton.style.display = 'inline-block';
    }
    
    // Limpar listas
    drawOrangeTeamElement.innerHTML = '';
    drawBlackTeamElement.innerHTML = '';
    
    // Preencher time laranja
    orangeTeam.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'mb-2';
        playerItem.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="player-name" style="font-size: 0.9rem;">
                    ${player.played_as_goalkeeper ? `<span class="text-blue">${player.name}</span>` : player.name}
                </div>
            </div>
        `;
        drawOrangeTeamElement.appendChild(playerItem);
    });
    
    // Preencher time preto
    blackTeam.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'mb-2';
        playerItem.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="player-name" style="font-size: 0.9rem;">
                    ${player.played_as_goalkeeper ? `<span class="text-blue">${player.name}</span>` : player.name}
                </div>
            </div>
        `;
        drawBlackTeamElement.appendChild(playerItem);
    });
}

/**
 * Confirma o sorteio e fecha o modal
 */
function confirmDraw() {
    // Fechar o modal usando Bootstrap
    const drawModal = bootstrap.Modal.getInstance(document.getElementById('draw-teams-modal'));
    if (drawModal) {
        drawModal.hide();
    }
    
    // Atualizar interface para mostrar os times
    setupTeamsView();
}

/**
 * Configura a visualização dos times
 */
function setupTeamsView() {
    if (!teamsContainer || !waitingPlayersContainer) return;
    
    // Esconder quadro de chegada e mostrar times
    if (arrivalBoardContainer) {
        arrivalBoardContainer.style.display = 'none';
    }
    
    teamsContainer.style.display = 'block';
    waitingPlayersContainer.style.display = 'block';
    
    // Atualizar times
    updateTeamsView();
    
    // Atualizar jogadores de fora
    updateWaitingPlayers();
}

/**
 * Atualiza a visualização dos times
 */
function updateTeamsView() {
    if (!orangeTeamContainer || !blackTeamContainer) return;
    
    // Atualizar contenedores de times
    const orangeGoalkeeperDropzone = document.getElementById('orange-goalkeeper-dropzone');
    const orangePlayersDropzone = document.getElementById('orange-players-dropzone');
    const blackGoalkeeperDropzone = document.getElementById('black-goalkeeper-dropzone');
    const blackPlayersDropzone = document.getElementById('black-players-dropzone');
    
    // Limpar áreas
    if (orangeGoalkeeperDropzone) orangeGoalkeeperDropzone.innerHTML = '';
    if (orangePlayersDropzone) orangePlayersDropzone.innerHTML = '';
    if (blackGoalkeeperDropzone) blackGoalkeeperDropzone.innerHTML = '';
    if (blackPlayersDropzone) blackPlayersDropzone.innerHTML = '';
    
    // Preencher times
    if (orangeTeam.length > 0) {
        // Time laranja
        orangeTeam.forEach(player => {
            const playerElement = createPlayerElement(player);
            if (player.played_as_goalkeeper && orangeGoalkeeperDropzone) {
                orangeGoalkeeperDropzone.appendChild(playerElement);
            } else if (orangePlayersDropzone) {
                orangePlayersDropzone.appendChild(playerElement);
            }
        });
    }
    
    if (blackTeam.length > 0) {
        // Time preto
        blackTeam.forEach(player => {
            const playerElement = createPlayerElement(player);
            if (player.played_as_goalkeeper && blackGoalkeeperDropzone) {
                blackGoalkeeperDropzone.appendChild(playerElement);
            } else if (blackPlayersDropzone) {
                blackPlayersDropzone.appendChild(playerElement);
            }
        });
    }
    
    // Atualizar contadores
    updateTeamsCount();
    
    // Atualizar contadores de vitória
    updateVictoryCounters();
    
    // Reconfigurar drag and drop
    setupDragAndDrop();
    
    // Atualizar placeholders para áreas vazias
    updateDropzonePlaceholders();
}

/**
 * Atualiza os contadores de vitória
 */
function updateVictoryCounters() {
    if (!orangeVictoryCount || !blackVictoryCount) return;
    
    // Limpar contadores
    orangeVictoryCount.innerHTML = '';
    blackVictoryCount.innerHTML = '';
    
    // Adicionar bolinhas para cada vitória
    for (let i = 0; i < orangeWins; i++) {
        const dot = document.createElement('div');
        dot.className = 'victory-dot';
        orangeVictoryCount.appendChild(dot);
    }
    
    for (let i = 0; i < blackWins; i++) {
        const dot = document.createElement('div');
        dot.className = 'victory-dot';
        blackVictoryCount.appendChild(dot);
    }
    
    // Adicionar classes para destaque visual
    if (orangeTeamBoard) {
        orangeTeamBoard.classList.remove('winner', 'loser');
        if (orangeWins > 0) {
            orangeTeamBoard.classList.add('winner');
        }
    }
    
    if (blackTeamBoard) {
        blackTeamBoard.classList.remove('winner', 'loser');
        if (blackWins > 0) {
            blackTeamBoard.classList.add('winner');
        }
    }
}

/**
 * Atualiza a lista de jogadores aguardando
 */
function updateWaitingPlayers() {
    const waitingPlayersList = document.getElementById('waiting-players-list');
    const noWaitingPlayers = document.getElementById('no-waiting-players');
    
    if (!waitingPlayersList) return;
    
    // Limpar lista atual
    waitingPlayersList.innerHTML = '';
    
    // Mostrar mensagem caso não haja jogadores aguardando
    if (noWaitingPlayers) {
        noWaitingPlayers.style.display = waitingPlayers.length === 0 ? 'block' : 'none';
    }
    
    // Se não há jogadores aguardando, adicionar um placeholder
    if (waitingPlayers.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'dropzone-placeholder';
        placeholder.innerHTML = '<i class="fas fa-user-clock"></i> Arraste jogadores para cá';
        waitingPlayersList.appendChild(placeholder);
        return;
    }
    
    // Adicionar jogadores à lista
    waitingPlayers.forEach(player => {
        const playerElement = createPlayerElement(player);
        waitingPlayersList.appendChild(playerElement);
    });
    
    // Atualizar o contador de jogadores
    const waitingCount = document.getElementById('waiting-players-count');
    if (waitingCount) {
        waitingCount.textContent = waitingPlayers.length;
    }
    
    // Reconfigurar drag and drop
    setupDragAndDrop();
}

/**
 * Configura os times a partir da última partida
 */
function setupTeamsFromLastMatch(match) {
    if (!match || !match.id) return;
    
    // Buscar detalhes da partida para obter os jogadores
    fetch(`/api/matches/${match.id}`)
        .then(response => response.json())
        .then(data => {
            // Limpar times atuais
            orangeTeam = [];
            blackTeam = [];
            waitingPlayers = [];
            
            // Configurar times com base nos jogadores da partida
            data.orange_team.forEach(player => {
                const fullPlayer = allPlayers.find(p => p.id === player.player_id);
                if (fullPlayer) {
                    orangeTeam.push({
                        ...fullPlayer,
                        played_as_goalkeeper: player.is_goalkeeper
                    });
                }
            });
            
            data.black_team.forEach(player => {
                const fullPlayer = allPlayers.find(p => p.id === player.player_id);
                if (fullPlayer) {
                    blackTeam.push({
                        ...fullPlayer,
                        played_as_goalkeeper: player.is_goalkeeper
                    });
                }
            });
            
            // Identificar jogadores que não estão nos times
            waitingPlayers = allPlayers.filter(player => {
                return !orangeTeam.find(p => p.id === player.id) && 
                       !blackTeam.find(p => p.id === player.id);
            });
            
            // Atualizar contadores de vitória
            updateConsecutiveWins();
            
            // Atualizar interface
            setupTeamsView();
        })
        .catch(error => {
            console.error('Erro ao carregar detalhes da partida:', error);
            showError('Não foi possível carregar os times da última partida.');
        });
}

/**
 * Atualiza os contadores de vitórias consecutivas
 */
function updateConsecutiveWins() {
    // Contar vitórias consecutivas
    orangeWins = 0;
    blackWins = 0;
    
    // Percorrer partidas em ordem inversa (mais recentes primeiro)
    for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        
        if (match.winner_team === 'orange') {
            orangeWins++;
            blackWins = 0;
        } else if (match.winner_team === 'black') {
            blackWins++;
            orangeWins = 0;
        } else {
            // Empate ou sem vencedor
            orangeWins = 0;
            blackWins = 0;
        }
        
        // Parar após encontrar a sequência atual
        if (orangeWins > 0 || blackWins > 0) {
            break;
        }
    }
}

/**
 * Abre o modal para editar times
 */
function openEditTeamsModal() {
    if (!orangeGoalkeeperSelect || !blackGoalkeeperSelect || !orangePlayersSelect || !blackPlayersSelect) return;
    
    // Limpar seleções anteriores
    orangeGoalkeeperSelect.innerHTML = '<option value="">-- Selecione o Goleiro --</option>';
    blackGoalkeeperSelect.innerHTML = '<option value="">-- Selecione o Goleiro --</option>';
    orangePlayersSelect.innerHTML = '';
    blackPlayersSelect.innerHTML = '';
    
    // Listar todos os jogadores disponíveis
    const availablePlayers = [
        ...orangeTeam,
        ...blackTeam,
        ...waitingPlayers
    ];
    
    // Preencher selects de goleiros
    availablePlayers.forEach(player => {
        // Adicionar aos selects de goleiros
        const orangeOption = document.createElement('option');
        orangeOption.value = player.id;
        orangeOption.textContent = player.name + (player.is_goalkeeper ? ' (Goleiro)' : '');
        orangeGoalkeeperSelect.appendChild(orangeOption);
        
        const blackOption = document.createElement('option');
        blackOption.value = player.id;
        blackOption.textContent = player.name + (player.is_goalkeeper ? ' (Goleiro)' : '');
        blackGoalkeeperSelect.appendChild(blackOption);
    });
    
    // Configurar seleções atuais
    const orangeGoalkeeper = orangeTeam.find(p => p.played_as_goalkeeper);
    const blackGoalkeeper = blackTeam.find(p => p.played_as_goalkeeper);
    
    if (orangeGoalkeeper) {
        orangeGoalkeeperSelect.value = orangeGoalkeeper.id;
    }
    
    if (blackGoalkeeper) {
        blackGoalkeeperSelect.value = blackGoalkeeper.id;
    }
    
    // Preencher listas de jogadores de linha
    availablePlayers.forEach(player => {
        // Time laranja (exceto goleiro)
        if (!orangeGoalkeeper || player.id !== orangeGoalkeeper.id) {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            playerItem.dataset.playerId = player.id;
            
            // Verificar se o jogador já está no time
            const isInOrangeTeam = orangeTeam.some(p => p.id === player.id && !p.played_as_goalkeeper);
            if (isInOrangeTeam) {
                playerItem.classList.add('selected');
            }
            
            playerItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="player-avatar mr-2">${getInitials(player.name)}</div>
                    <div class="player-name">
                        ${player.name}
                        ${player.is_goalkeeper ? '<span class="badge badge-blue ml-1">Goleiro</span>' : ''}
                    </div>
                </div>
            `;
            
            orangePlayersSelect.appendChild(playerItem);
            
            // Adicionar evento de seleção
            playerItem.addEventListener('click', () => {
                playerItem.classList.toggle('selected');
            });
        }
        
        // Time preto (exceto goleiro)
        if (!blackGoalkeeper || player.id !== blackGoalkeeper.id) {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            playerItem.dataset.playerId = player.id;
            
            // Verificar se o jogador já está no time
            const isInBlackTeam = blackTeam.some(p => p.id === player.id && !p.played_as_goalkeeper);
            if (isInBlackTeam) {
                playerItem.classList.add('selected');
            }
            
            playerItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="player-avatar mr-2">${getInitials(player.name)}</div>
                    <div class="player-name">
                        ${player.name}
                        ${player.is_goalkeeper ? '<span class="badge badge-blue ml-1">Goleiro</span>' : ''}
                    </div>
                </div>
            `;
            
            blackPlayersSelect.appendChild(playerItem);
            
            // Adicionar evento de seleção
            playerItem.addEventListener('click', () => {
                playerItem.classList.toggle('selected');
            });
        }
    });
    
    // Abrir o modal usando Bootstrap
    const editTeamsModal = new bootstrap.Modal(document.getElementById('edit-teams-modal'));
    editTeamsModal.show();
}

/**
 * Salva os times editados
 */
function saveEditedTeams() {
    if (!orangeGoalkeeperSelect || !blackGoalkeeperSelect || !orangePlayersSelect || !blackPlayersSelect) return;
    
    // Obter IDs dos goleiros
    const orangeGoalkeeperId = parseInt(orangeGoalkeeperSelect.value);
    const blackGoalkeeperId = parseInt(blackGoalkeeperSelect.value);
    
    if (!orangeGoalkeeperId || !blackGoalkeeperId) {
        showError('Selecione um goleiro para cada time.');
        return;
    }
    
    if (orangeGoalkeeperId === blackGoalkeeperId) {
        showError('O mesmo jogador não pode ser goleiro dos dois times.');
        return;
    }
    
    // Obter jogadores de linha selecionados
    const orangePlayerItems = orangePlayersSelect.querySelectorAll('.player-item.selected');
    const blackPlayerItems = blackPlayersSelect.querySelectorAll('.player-item.selected');
    
    const orangePlayerIds = Array.from(orangePlayerItems).map(item => parseInt(item.dataset.playerId));
    const blackPlayerIds = Array.from(blackPlayerItems).map(item => parseInt(item.dataset.playerId));
    
    // Verificar se há 4 jogadores de linha em cada time
    if (orangePlayerIds.length !== 4) {
        showError('O time Laranja deve ter exatamente 4 jogadores de linha.');
        return;
    }
    
    if (blackPlayerIds.length !== 4) {
        showError('O time Preto deve ter exatamente 4 jogadores de linha.');
        return;
    }
    
    // Verificar se não há jogadores repetidos
    const allSelectedIds = [orangeGoalkeeperId, blackGoalkeeperId, ...orangePlayerIds, ...blackPlayerIds];
    const uniqueIds = new Set(allSelectedIds);
    
    if (uniqueIds.size !== allSelectedIds.length) {
        showError('Um jogador não pode estar em ambos os times.');
        return;
    }
    
    // Recriar times
    const orangeGoalkeeper = allPlayers.find(p => p.id === orangeGoalkeeperId);
    const blackGoalkeeper = allPlayers.find(p => p.id === blackGoalkeeperId);
    
    if (!orangeGoalkeeper || !blackGoalkeeper) {
        showError('Erro ao encontrar os goleiros selecionados.');
        return;
    }
    
    // Montar time laranja
    orangeTeam = [
        { ...orangeGoalkeeper, played_as_goalkeeper: true }
    ];
    
    // Adicionar jogadores de linha
    orangePlayerIds.forEach(id => {
        const player = allPlayers.find(p => p.id === id);
        if (player) {
            orangeTeam.push({ ...player, played_as_goalkeeper: false });
        }
    });
    
    // Montar time preto
    blackTeam = [
        { ...blackGoalkeeper, played_as_goalkeeper: true }
    ];
    
    // Adicionar jogadores de linha
    blackPlayerIds.forEach(id => {
        const player = allPlayers.find(p => p.id === id);
        if (player) {
            blackTeam.push({ ...player, played_as_goalkeeper: false });
        }
    });
    
    // Atualizar jogadores de fora
    waitingPlayers = allPlayers.filter(player => {
        return !orangeTeam.find(p => p.id === player.id) && 
               !blackTeam.find(p => p.id === player.id);
    });
    
    // Atualizar interface
    updateTeamsView();
    updateWaitingPlayers();
    
    // Fechar modal usando Bootstrap
    const modal = bootstrap.Modal.getInstance(document.getElementById('edit-teams-modal'));
    if (modal) {
        modal.hide();
    }
}

/**
 * Inicia uma nova partida
 */
async function startMatch() {
    if (orangeTeam.length !== 5 || blackTeam.length !== 5) {
        showError('Cada time deve ter 5 jogadores (1 goleiro e 4 jogadores de linha).');
        return;
    }
    
    try {
        showLoading(true);
        
        // Preparar dados dos times
        const orangeTeamData = orangeTeam.map(player => ({
            player_id: player.id,
            is_goalkeeper: player.played_as_goalkeeper
        }));
        
        const blackTeamData = blackTeam.map(player => ({
            player_id: player.id,
            is_goalkeeper: player.played_as_goalkeeper
        }));
        
        // Criar nova partida
        const response = await fetch(`/api/sessions/${sessionData.id}/matches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orange_team: orangeTeamData,
                black_team: blackTeamData
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Redirecionar para a página da partida
            window.location.href = `/match/${data.match_id}`;
        } else {
            showError(data.message || 'Erro ao iniciar partida.');
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao iniciar partida:', error);
        showError('Erro ao conectar com o servidor. Tente novamente.');
        showLoading(false);
    }
}

/**
 * Atualiza a visualização de partidas
 */
function updateMatchesView() {
    if (!matchesContainer || !noMatchesElement) return;
    
    if (matches.length === 0) {
        matchesContainer.innerHTML = '';
        noMatchesElement.style.display = 'block';
        return;
    }
    
    noMatchesElement.style.display = 'none';
    matchesContainer.innerHTML = '';
    
    // Ordenar partidas pela mais recente primeiro
    const sortedMatches = [...matches].sort((a, b) => b.match_number - a.match_number);
    
    // Criar card para cada partida
    sortedMatches.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.className = 'card mb-3';
        
        // Determinar classe de status
        let statusClass = 'secondary';
        let statusText = 'Encerrada';
        
        if (match.is_active) {
            statusClass = 'success';
            statusText = 'Em andamento';
        }
        
        // Determinar resultado
        let resultText = 'Empate';
        let resultClass = '';
        
        if (match.winner_team === 'orange') {
            resultText = 'Vitória do Time Laranja';
            resultClass = 'text-orange';
        } else if (match.winner_team === 'black') {
            resultText = 'Vitória do Time Preto';
            resultClass = 'text-black';
        }
        
        matchCard.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">Partida #${match.match_number}</h5>
                <span class="badge badge-${statusClass}">${statusText}</span>
            </div>
            <div class="card-body">
                <div class="score-board mb-3">
                    <div class="team-score orange">
                        <span class="team-name">Time Laranja</span>
                        <span class="team-score-value">${match.orange_score}</span>
                    </div>
                    <div class="score-divider">x</div>
                    <div class="team-score black">
                        <span class="team-name">Time Preto</span>
                        <span class="team-score-value">${match.black_score}</span>
                    </div>
                </div>
                
                ${!match.is_active ? `<p class="text-center ${resultClass} fw-bold">${resultText}</p>` : ''}
                
                <div class="d-flex justify-content-center mt-3">
                    <a href="/match/${match.id}" class="btn btn-primary">
                        ${match.is_active ? 'Continuar Partida' : 'Ver Detalhes'}
                    </a>
                </div>
            </div>
            <div class="card-footer text-muted">
                <small>Início: ${formatDate(match.start_time, true)}</small>
                ${match.end_time ? `<small class="ms-3">Fim: ${formatDate(match.end_time, true)}</small>` : ''}
            </div>
        `;
        
        matchesContainer.appendChild(matchCard);
    });
}

/**
 * Encerra a sessão atual
 */
async function endSession() {
    try {
        showLoading(true);
        
        // Fechar o modal usando Bootstrap
        const modal = bootstrap.Modal.getInstance(document.getElementById('end-session-confirm-modal'));
        if (modal) {
            modal.hide();
        }
        
        const response = await fetch(`/api/sessions/${sessionData.id}/end`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Sessão encerrada com sucesso!');
            // Recarregar a página para atualizar o estado
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showError(data.message || 'Erro ao encerrar sessão.');
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao encerrar sessão:', error);
        showError('Erro ao conectar com o servidor. Tente novamente.');
        showLoading(false);
    }
}

/**
 * Abre o modal de fim de partida com os dados da última partida
 */
function openEndMatchModal(matchId) {
    if (!resultOrangeScore || !resultBlackScore || !winnerText || !drawResolution) return;
    
    const match = matches.find(m => m.id === matchId);
    
    if (!match) {
        showError('Partida não encontrada.');
        return;
    }
    
    matchResult = {
        matchId: match.id,
        winner: null
    };
    
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
    
    // Configurar os botões de pontuação
    setupScoreButtons();
    
    // Abrir o modal usando Bootstrap
    const endMatchModal = new bootstrap.Modal(document.getElementById('end-match-modal'));
    endMatchModal.show();
}

/**
 * Confirma o encerramento da partida
 */
async function confirmMatchEnd() {
    if (!matchResult.matchId) {
        showError('Nenhuma partida selecionada.');
        return;
    }
    
    if (matchResult.winner === null && drawResolution.style.display !== 'none') {
        showError('Selecione o vencedor do par ou ímpar.');
        return;
    }
    
    try {
        showLoading(true);
        
        // Fechar o modal usando Bootstrap
        const modal = bootstrap.Modal.getInstance(document.getElementById('end-match-modal'));
        if (modal) {
            modal.hide();
        }
        
        const response = await fetch(`/api/matches/${matchResult.matchId}/end`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                winner_team: matchResult.winner
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Partida encerrada com sucesso!');
            
            // Recarregar a página para atualizar o estado
            setTimeout(() => {
                window.location.reload();
            }, 1500);
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
 * Configurar eventos para botões de pontuação no modal de fim de partida
 */
function setupScoreButtons() {
    const scoreButtons = document.querySelectorAll('.score-btn');
    
    scoreButtons.forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            
            const team = button.getAttribute('data-team');
            const action = button.getAttribute('data-action');
            const scoreElement = document.getElementById(`result-${team}-score`);
            
            if (!scoreElement) return;
            
            let score = parseInt(scoreElement.textContent);
            
            if (action === 'increase') {
                score++;
            } else if (action === 'decrease' && score > 0) {
                score--;
            }
            
            scoreElement.textContent = score;
            
            // Atualizar texto do vencedor
            updateWinnerText();
        });
    });
}

/**
 * Atualizar o texto do vencedor com base nos placares
 */
function updateWinnerText() {
    const orangeScore = parseInt(document.getElementById('result-orange-score').textContent);
    const blackScore = parseInt(document.getElementById('result-black-score').textContent);
    const winnerText = document.getElementById('winner-text');
    const drawResolution = document.getElementById('draw-resolution');
    
    if (orangeScore > blackScore) {
        winnerText.textContent = 'Time Laranja venceu!';
        winnerText.className = 'text-orange';
        drawResolution.style.display = 'none';
        matchResult.winner = 'orange';
    } else if (blackScore > orangeScore) {
        winnerText.textContent = 'Time Preto venceu!';
        winnerText.className = 'text-black';
        drawResolution.style.display = 'none';
        matchResult.winner = 'black';
    } else {
        winnerText.textContent = 'Empate!';
        winnerText.className = 'text-muted';
        drawResolution.style.display = 'block';
        matchResult.winner = null;
    }
}

/**
 * Configuração de drag-and-drop para gerenciamento de times
 */

/**
 * Configura o drag-and-drop para os jogadores
 */
function setupDragAndDrop() {
    // Remover eventos anteriores se já existirem
    removeDragAndDropEvents();
    
    // Elementos arrastáveis
    const draggableElements = document.querySelectorAll('.player-item');
    
    // Áreas onde os elementos podem ser soltos
    const dropzones = document.querySelectorAll('.goalkeeper-dropzone, .players-dropzone, .waiting-dropzone');
    
    // Adicionar eventos para cada elemento arrastável
    draggableElements.forEach(element => {
        element.setAttribute('draggable', 'true');
        element.setAttribute('title', 'Arraste para mover o jogador');
        
        // Eventos de drag para os elementos
        element.addEventListener('dragstart', dragStart);
        element.addEventListener('dragend', dragEnd);
        element.addEventListener('touchstart', touchStart, { passive: false });
        element.addEventListener('touchmove', touchMove, { passive: false });
        element.addEventListener('touchend', touchEnd);
        
        // Adicionar indicador visual de que é arrastável
        if (!element.querySelector('.drag-handle')) {
            const dragHandle = document.createElement('div');
            dragHandle.className = 'drag-handle';
            dragHandle.innerHTML = '<i class="fas fa-grip-lines"></i>';
            element.appendChild(dragHandle);
        }
        
        // Impedir comportamento padrão de links dentro dos elementos arrastáveis
        const links = element.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', e => {
                if (element.classList.contains('dragging')) {
                    e.preventDefault();
                }
            });
        });
    });
    
    // Adicionar eventos para cada área de destino
    dropzones.forEach(dropzone => {
        dropzone.addEventListener('dragover', dragOver);
        dropzone.addEventListener('dragleave', dragLeave);
        dropzone.addEventListener('drop', drop);
        
        // Adicionar rótulos para áreas vazias
        if (dropzone.children.length === 0 && !dropzone.querySelector('.dropzone-placeholder')) {
            const placeholder = document.createElement('div');
            placeholder.className = 'dropzone-placeholder';
            
            if (dropzone.classList.contains('goalkeeper-dropzone')) {
                placeholder.textContent = 'Arraste um goleiro para cá';
            } else if (dropzone.classList.contains('players-dropzone')) {
                placeholder.textContent = 'Arraste jogadores para cá';
            } else if (dropzone.classList.contains('waiting-dropzone')) {
                placeholder.textContent = 'Jogadores aguardando';
            }
            
            dropzone.appendChild(placeholder);
        }
    });
    
    // Adicionar instruções visuais
    addDragInstructions();
}

/**
 * Remove eventos de drag and drop anteriores
 */
function removeDragAndDropEvents() {
    const draggableElements = document.querySelectorAll('.player-item');
    draggableElements.forEach(element => {
        element.removeEventListener('dragstart', dragStart);
        element.removeEventListener('dragend', dragEnd);
        element.removeEventListener('touchstart', touchStart);
        element.removeEventListener('touchmove', touchMove);
        element.removeEventListener('touchend', touchEnd);
    });
    
    const dropzones = document.querySelectorAll('.goalkeeper-dropzone, .players-dropzone, .waiting-dropzone');
    dropzones.forEach(dropzone => {
        dropzone.removeEventListener('dragover', dragOver);
        dropzone.removeEventListener('dragleave', dragLeave);
        dropzone.removeEventListener('drop', drop);
    });
}

/**
 * Adiciona instruções visuais para drag and drop
 */
function addDragInstructions() {
    // Verificar se já existe
    if (document.querySelector('.drag-instructions')) return;
    
    // Adicionar uma mensagem de instruções
    const teamsContainer = document.getElementById('teams-container');
    if (teamsContainer && !teamsContainer.querySelector('.drag-instructions')) {
        const instructions = document.createElement('div');
        instructions.className = 'drag-instructions alert alert-info mb-3';
        instructions.innerHTML = '<i class="fas fa-info-circle"></i> Arraste os jogadores entre os times para reorganizá-los. O goleiro deve ser colocado na área de goleiro.';
        teamsContainer.insertBefore(instructions, teamsContainer.firstChild);
        
        // Adicionar botão para fechar as instruções
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-close';
        closeBtn.setAttribute('aria-label', 'Fechar');
        closeBtn.addEventListener('click', () => instructions.remove());
        instructions.appendChild(closeBtn);
        
        // Auto-fechar após alguns segundos
        setTimeout(() => {
            if (instructions.parentNode) {
                instructions.classList.add('fade-out');
                setTimeout(() => instructions.remove(), 500);
            }
        }, 10000);
    }
}

/**
 * Função chamada quando um elemento começa a ser arrastado
 */
function dragStart(e) {
    this.classList.add('dragging');
    
    // Guardar o ID do jogador e a área de origem nos dados de transferência
    const playerId = this.getAttribute('data-player-id');
    const sourceArea = this.parentElement.getAttribute('data-area');
    const isGoalkeeper = this.getAttribute('data-goalkeeper') === 'true';
    
    e.dataTransfer.setData('text/plain', JSON.stringify({
        playerId: playerId,
        sourceArea: sourceArea,
        isGoalkeeper: isGoalkeeper
    }));
    
    // Criar uma imagem fantasma para arrastar
    const ghostImage = this.cloneNode(true);
    ghostImage.style.opacity = '0.6';
    ghostImage.style.position = 'absolute';
    ghostImage.style.top = '-1000px';
    document.body.appendChild(ghostImage);
    
    e.dataTransfer.setDragImage(ghostImage, 20, 20);
    
    // Remover a imagem fantasma após o início do arrasto
    setTimeout(() => {
        document.body.removeChild(ghostImage);
    }, 0);
    
    // Destacar áreas de destino válidas
    highlightValidDropzones(isGoalkeeper);
    
    // Efeito de movimento
    e.dataTransfer.effectAllowed = 'move';
}

/**
 * Função chamada quando começa um toque (para dispositivos móveis)
 */
function touchStart(e) {
    // Verificar se já existe um elemento sendo arrastado
    if (document.querySelector('.dragging')) return;
    
    const touch = e.touches[0];
    const element = this;
    
    element.classList.add('dragging');
    element.classList.add('touch-dragging');
    
    // Guardar a posição inicial
    element.initialX = touch.clientX;
    element.initialY = touch.clientY;
    
    // Guardar a posição do elemento
    const rect = element.getBoundingClientRect();
    element.offsetX = touch.clientX - rect.left;
    element.offsetY = touch.clientY - rect.top;
    
    // Posicionar o elemento
    element.style.position = 'fixed';
    element.style.zIndex = '1000';
    element.style.width = `${rect.width}px`;
    
    // Guardar o elemento atual
    window.currentDragElement = element;
    window.currentDragParent = element.parentElement;
    
    // Prevenir o comportamento padrão (scroll)
    e.preventDefault();
}

/**
 * Função chamada durante o movimento de toque
 */
function touchMove(e) {
    if (!window.currentDragElement) return;
    
    const element = window.currentDragElement;
    const touch = e.touches[0];
    
    // Mover o elemento
    element.style.left = `${touch.clientX - element.offsetX}px`;
    element.style.top = `${touch.clientY - element.offsetY}px`;
    
    // Verificar se está sobre uma área de destino
    const dropzones = document.querySelectorAll('.goalkeeper-dropzone, .players-dropzone, .waiting-dropzone');
    let targetDropzone = null;
    
    dropzones.forEach(dropzone => {
        const rect = dropzone.getBoundingClientRect();
        if (
            touch.clientX >= rect.left && 
            touch.clientX <= rect.right && 
            touch.clientY >= rect.top && 
            touch.clientY <= rect.bottom
        ) {
            targetDropzone = dropzone;
        }
        
        // Remover highlight anterior
        dropzone.classList.remove('drag-over');
    });
    
    // Destacar a área de destino
    if (targetDropzone) {
        targetDropzone.classList.add('drag-over');
        window.currentTargetDropzone = targetDropzone;
    } else {
        window.currentTargetDropzone = null;
    }
    
    // Prevenir o comportamento padrão (scroll)
    e.preventDefault();
}

/**
 * Função chamada quando termina um toque
 */
function touchEnd(e) {
    if (!window.currentDragElement) return;
    
    const element = window.currentDragElement;
    
    // Remover os estilos
    element.style.position = '';
    element.style.zIndex = '';
    element.style.left = '';
    element.style.top = '';
    element.style.width = '';
    
    element.classList.remove('dragging');
    element.classList.remove('touch-dragging');
    
    // Se tem uma área de destino, mover o elemento
    if (window.currentTargetDropzone) {
        const targetDropzone = window.currentTargetDropzone;
        targetDropzone.classList.remove('drag-over');
        
        // Obter informações do jogador
        const playerId = parseInt(element.getAttribute('data-player-id'));
        const sourceArea = window.currentDragParent.getAttribute('data-area');
        const isGoalkeeper = element.getAttribute('data-goalkeeper') === 'true';
        
        // Obter informações da área de destino
        const targetArea = targetDropzone.getAttribute('data-area');
        const targetTeam = targetDropzone.getAttribute('data-team');
        const isGoalkeeperZone = targetDropzone.classList.contains('goalkeeper-dropzone');
        
        // Validar regras para goleiro
        if (isGoalkeeperZone && !isGoalkeeper && !confirm('Este jogador não é goleiro. Confirma que deseja colocá-lo como goleiro?')) {
            // Restaurar ao local original
            window.currentDragParent.appendChild(element);
        } else {
            // Mover o elemento para a área de destino
            targetDropzone.appendChild(element);
            
            // Atualizar os arrays de times
            updateTeamArrays(playerId, sourceArea, targetArea, targetTeam, isGoalkeeperZone);
        }
    } else {
        // Restaurar ao local original
        window.currentDragParent.appendChild(element);
    }
    
    // Limpar as variáveis
    window.currentDragElement = null;
    window.currentDragParent = null;
    window.currentTargetDropzone = null;
    
    // Remover highlight de todas as áreas
    const dropzones = document.querySelectorAll('.goalkeeper-dropzone, .players-dropzone, .waiting-dropzone');
    dropzones.forEach(dropzone => {
        dropzone.classList.remove('drag-over');
    });
}

/**
 * Destaca as áreas de destino válidas para um jogador
 */
function highlightValidDropzones(isGoalkeeper) {
    const dropzones = document.querySelectorAll('.goalkeeper-dropzone, .players-dropzone, .waiting-dropzone');
    
    dropzones.forEach(dropzone => {
        if (dropzone.classList.contains('goalkeeper-dropzone')) {
            // Adicionar uma classe especial para destacar áreas de goleiro
            if (isGoalkeeper) {
                dropzone.classList.add('valid-dropzone');
            }
        } else {
            dropzone.classList.add('valid-dropzone');
        }
    });
}

/**
 * Função chamada quando um elemento termina de ser arrastado
 */
function dragEnd() {
    this.classList.remove('dragging');
    
    // Remover destaque de todas as áreas
    const dropzones = document.querySelectorAll('.goalkeeper-dropzone, .players-dropzone, .waiting-dropzone');
    dropzones.forEach(dropzone => {
        dropzone.classList.remove('drag-over');
        dropzone.classList.remove('valid-dropzone');
    });
    
    // Ocultar placeholders
    updateDropzonePlaceholders();
}

/**
 * Função chamada quando um elemento está sobre uma área de destino
 */
function dragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
    e.dataTransfer.dropEffect = 'move';
}

/**
 * Função chamada quando um elemento sai de uma área de destino
 */
function dragLeave() {
    this.classList.remove('drag-over');
}

/**
 * Função chamada quando um elemento é solto em uma área de destino
 */
function drop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    // Obter os dados do elemento arrastado
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const playerId = parseInt(data.playerId);
    const sourceArea = data.sourceArea;
    const isGoalkeeper = data.isGoalkeeper;
    
    // Obter informações da área de destino
    const targetArea = this.getAttribute('data-area');
    const targetTeam = this.getAttribute('data-team');
    const isGoalkeeperZone = this.classList.contains('goalkeeper-dropzone');
    
    // Validar se o jogador pode ser solto nesta área
    // Para área de goleiro, somente goleiros (ou jogadores que possam atuar como goleiro)
    if (isGoalkeeperZone && !isGoalkeeper) {
        // Verificar se o jogador já atuou como goleiro antes ou pedir confirmação
        const player = findPlayerById(playerId);
        if (player && player.can_play_goalkeeper) {
            // Jogador já jogou como goleiro antes, permitir sem confirmação
        } else if (!confirm('Este jogador não é goleiro. Confirma que deseja colocá-lo como goleiro?')) {
            return;
        }
    }
    
    // Encontrar o elemento arrastado
    const draggedElement = document.querySelector(`.player-item[data-player-id="${playerId}"]`);
    
    if (!draggedElement) return;
    
    // Mover o elemento para a área de destino
    this.appendChild(draggedElement);
    
    // Remover placeholders se existirem
    const placeholder = this.querySelector('.dropzone-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    // Atualizar os arrays de times
    updateTeamArrays(playerId, sourceArea, targetArea, targetTeam, isGoalkeeperZone);
    
    // Atualizar placeholders
    updateDropzonePlaceholders();
}

/**
 * Atualiza os placeholders para áreas vazias
 */
function updateDropzonePlaceholders() {
    const dropzones = document.querySelectorAll('.goalkeeper-dropzone, .players-dropzone, .waiting-dropzone');
    
    dropzones.forEach(dropzone => {
        // Remover placeholder existente
        const existingPlaceholder = dropzone.querySelector('.dropzone-placeholder');
        if (existingPlaceholder) {
            existingPlaceholder.remove();
        }
        
        // Se não tem filhos que são jogadores, adicionar placeholder
        const hasPlayers = Array.from(dropzone.children).some(child => child.classList.contains('player-item'));
        
        if (!hasPlayers) {
            const placeholder = document.createElement('div');
            placeholder.className = 'dropzone-placeholder';
            
            if (dropzone.classList.contains('goalkeeper-dropzone')) {
                placeholder.innerHTML = '<i class="fas fa-hands"></i> Área do Goleiro';
            } else if (dropzone.classList.contains('players-dropzone')) {
                placeholder.innerHTML = '<i class="fas fa-running"></i> Área de Jogadores';
            } else if (dropzone.classList.contains('waiting-dropzone') && dropzone.children.length === 0) {
                placeholder.innerHTML = '<i class="fas fa-user-clock"></i> Arraste jogadores para cá';
            }
            
            dropzone.appendChild(placeholder);
        }
    });
}

/**
 * Encontra um jogador pelo ID
 */
function findPlayerById(playerId) {
    // Procurar em todos os arrays
    return allPlayers.find(p => p.id === playerId) || 
           orangeTeam.find(p => p.id === playerId) || 
           blackTeam.find(p => p.id === playerId) || 
           waitingPlayers.find(p => p.id === playerId);
}

/**
 * Atualiza os arrays de times após uma operação de drag-and-drop
 */
function updateTeamArrays(playerId, sourceArea, targetArea, targetTeam, isGoalkeeperZone) {
    let player;
    
    // Remover o jogador da área de origem
    if (sourceArea === 'orange') {
        player = orangeTeam.find(p => p.id === playerId);
        orangeTeam = orangeTeam.filter(p => p.id !== playerId);
    } else if (sourceArea === 'black') {
        player = blackTeam.find(p => p.id === playerId);
        blackTeam = blackTeam.filter(p => p.id !== playerId);
    } else if (sourceArea === 'waiting') {
        player = waitingPlayers.find(p => p.id === playerId);
        waitingPlayers = waitingPlayers.filter(p => p.id !== playerId);
    }
    
    if (!player) {
        // Buscar o jogador na lista completa se não encontrou no time
        player = allPlayers.find(p => p.id === playerId);
    }
    
    if (!player) return;
    
    // Adicionar à área de destino
    if (targetArea === 'orange') {
        player.played_as_goalkeeper = isGoalkeeperZone;
        orangeTeam.push(player);
    } else if (targetArea === 'black') {
        player.played_as_goalkeeper = isGoalkeeperZone;
        blackTeam.push(player);
    } else if (targetArea === 'waiting') {
        waitingPlayers.push(player);
    }
    
    // Atualizar o contador de jogadores nos times
    updateTeamsCount();
}

/**
 * Atualiza os contadores de jogadores nos times
 */
function updateTeamsCount() {
    const orangeCount = document.getElementById('orange-team-count');
    const blackCount = document.getElementById('black-team-count');
    const waitingCount = document.getElementById('waiting-players-count');
    
    if (orangeCount) orangeCount.textContent = orangeTeam.length;
    if (blackCount) blackCount.textContent = blackTeam.length;
    if (waitingCount) waitingCount.textContent = waitingPlayers.length;
    
    // Habilitar ou desabilitar botão de iniciar partida com base no número de jogadores
    if (startMatchButton) {
        const minPlayersPerTeam = 5; // Mínimo de 5 jogadores por time (1 goleiro + 4 jogadores)
        const orangeHasGoalkeeper = orangeTeam.some(p => p.played_as_goalkeeper);
        const blackHasGoalkeeper = blackTeam.some(p => p.played_as_goalkeeper);
        
        startMatchButton.disabled = orangeTeam.length < minPlayersPerTeam || 
                                   blackTeam.length < minPlayersPerTeam ||
                                   !orangeHasGoalkeeper ||
                                   !blackHasGoalkeeper;
    }
}

/**
 * Função para randomizar os times usando drag-and-drop
 */
function randomizeTeams() {
    // Juntar todos os jogadores
    const allPlayersInTeams = [...orangeTeam, ...blackTeam, ...waitingPlayers];
    
    // Separar goleiros e jogadores de linha
    const goalkeepers = allPlayersInTeams.filter(p => p.is_goalkeeper);
    const fieldPlayers = allPlayersInTeams.filter(p => !p.is_goalkeeper);
    
    // Limpar os times existentes
    orangeTeam = [];
    blackTeam = [];
    waitingPlayers = [];
    
    // Embaralhar os arrays
    const shuffledGoalkeepers = shuffleArray(goalkeepers);
    const shuffledFieldPlayers = shuffleArray(fieldPlayers);
    
    // Distribuir goleiros
    if (shuffledGoalkeepers.length >= 2) {
        // Dois ou mais goleiros disponíveis
        orangeTeam.push({ ...shuffledGoalkeepers[0], played_as_goalkeeper: true });
        blackTeam.push({ ...shuffledGoalkeepers[1], played_as_goalkeeper: true });
        
        // Adicionar goleiros excedentes como jogadores de linha
        for (let i = 2; i < shuffledGoalkeepers.length; i++) {
            const team = i % 2 === 0 ? orangeTeam : blackTeam;
            team.push({ ...shuffledGoalkeepers[i], played_as_goalkeeper: false });
        }
    } else if (shuffledGoalkeepers.length === 1) {
        // Apenas um goleiro disponível
        orangeTeam.push({ ...shuffledGoalkeepers[0], played_as_goalkeeper: true });
        
        // Usar jogador de linha como goleiro
        if (shuffledFieldPlayers.length > 0) {
            blackTeam.push({ ...shuffledFieldPlayers.shift(), played_as_goalkeeper: true });
        }
    } else {
        // Nenhum goleiro disponível
        if (shuffledFieldPlayers.length >= 2) {
            orangeTeam.push({ ...shuffledFieldPlayers.shift(), played_as_goalkeeper: true });
            blackTeam.push({ ...shuffledFieldPlayers.shift(), played_as_goalkeeper: true });
        }
    }
    
    // Distribuir jogadores de linha (4 para cada time)
    const playersPerTeam = Math.min(4, Math.floor(shuffledFieldPlayers.length / 2));
    
    for (let i = 0; i < playersPerTeam * 2; i++) {
        const player = { ...shuffledFieldPlayers[i], played_as_goalkeeper: false };
        
        if (i % 2 === 0) {
            orangeTeam.push(player);
        } else {
            blackTeam.push(player);
        }
    }
    
    // Jogadores que ficaram de fora
    waitingPlayers = shuffledFieldPlayers.slice(playersPerTeam * 2);
    
    // Atualizar a interface para refletir as mudanças
    updateTeamsView();
    updateWaitingPlayers();
}

/**
 * Cria um elemento HTML para um jogador
 */
function createPlayerElement(player) {
    const playerElement = document.createElement('div');
    playerElement.className = 'player-item';
    playerElement.setAttribute('draggable', 'true');
    playerElement.setAttribute('data-player-id', player.id);
    playerElement.setAttribute('data-goalkeeper', player.is_goalkeeper);
    
    // Avatar do jogador (iniciais)
    const avatarElement = document.createElement('div');
    avatarElement.className = 'player-avatar';
    avatarElement.textContent = getInitials(player.name);
    
    // Informações do jogador
    const infoElement = document.createElement('div');
    infoElement.className = 'player-info';
    
    const nameElement = document.createElement('div');
    nameElement.className = 'player-name';
    nameElement.textContent = player.name;
    
    // Badge de goleiro se aplicável
    if (player.is_goalkeeper) {
        const badgeElement = document.createElement('span');
        badgeElement.className = 'goalkeeper-badge';
        badgeElement.textContent = 'Goleiro';
        nameElement.appendChild(badgeElement);
    }
    
    // Draghandle para arrastar
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '<i class="fas fa-grip-lines"></i>';
    
    infoElement.appendChild(nameElement);
    playerElement.appendChild(avatarElement);
    playerElement.appendChild(infoElement);
    playerElement.appendChild(dragHandle);
    
    return playerElement;
}
