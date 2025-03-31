/**
 * Dashboard do Futsal de Domingo
 * Script responsável pelo gerenciamento da página principal com estatísticas
 * 
 * Autor: Raphael Nugas
 * Data: 2023
 */

console.log('Dashboard.js: Inicializando script...');

// Estado da aplicação
let players = [];
let dashboardData = null;
let currentSort = {
    column: 'goals',
    direction: 'desc'
};

// Funções de acesso aos elementos DOM (só fazem a busca quando chamadas)
const getElement = (id) => document.getElementById(id);
const getElements = (selector) => document.querySelectorAll(selector);

// Getters para elementos DOM
const getTopScorerElement = () => getElement('top-scorer');
const getTopAssistantElement = () => getElement('top-assistant');
const getTopGoalkeeperElement = () => getElement('top-goalkeeper');
const getStatsTableBody = () => getElement('stats-table-body');
const getStatsLoader = () => getElement('stats-loader');
const getStatsTable = () => getElement('stats-table');
const getLoadingElement = () => getElement('loading');
const getFilterButtons = () => getElements('.filter-btn');

/**
 * Abrevia um nome para exibição em telas menores
 * @param {string} name - Nome completo
 * @returns {string} Nome abreviado
 */
function abbreviateName(name) {
    if (!name) return '';
    const nameParts = name.split(' ');
    
    // Se for um nome único, retorna como está
    if (nameParts.length === 1) {
        return nameParts[0];
    }
    
    // Se for nome e sobrenome, retorna nome completo + inicial do sobrenome
    if (nameParts.length === 2) {
        const firstName = nameParts[0];
        const lastInitial = nameParts[1].charAt(0) + '.';
        return `${firstName} ${lastInitial}`;
    }
    
    // Se for nome composto, usa primeiro nome + inicial do sobrenome
    const firstName = nameParts[0];
    const lastInitial = nameParts[nameParts.length - 1].charAt(0) + '.';
    return `${firstName} ${lastInitial}`;
}

/**
 * Inicialização do Dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard.js: DOM carregado, inicializando dashboard');
    
    try {
        // Verificar se estamos na página correta antes de carregar os dados
        if (getTopScorerElement() && getStatsTableBody()) {
            console.log('Dashboard.js: Elementos encontrados, carregando dados');
            
            // Carregar dados para o dashboard
            loadDashboardData();
            
            // Adicionar eventos aos elementos
            setupEventListeners();
        } else {
            console.log('Dashboard.js: Esta página não contém elementos de dashboard');
        }
    } catch (error) {
        console.error('Dashboard.js: Erro durante inicialização:', error);
    }
});

/**
 * Configura os listeners de eventos
 */
function setupEventListeners() {
    // Eventos de autenticação gerenciados pelo auth.js
    

    
    // Eventos para os botões de filtro
    if (getFilterButtons()) {
        getFilterButtons().forEach(button => {
            button.addEventListener('click', () => {
                const column = button.getAttribute('data-filter');
                sortTable(column);
                
                // Atualizar classe ativa nos botões
                getFilterButtons().forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }
    
    // Eventos para clicar nas colunas da tabela
    if (getStatsTable()) {
        const headers = getStatsTable().querySelectorAll('th');
        headers.forEach(header => {
            if (header.getAttribute('data-sort')) {
                header.addEventListener('click', () => {
                    const column = header.getAttribute('data-sort');
                    sortTable(column);
                });
            }
        });
    }
}

/**
 * Carrega os dados do dashboard a partir da API
 */
async function loadDashboardData() {
    console.log('Dashboard.js: Carregando dados do dashboard...');
    
    showLoading(true);
    
    try {
        // Inicializar dados vazios por padrão
        dashboardData = {
            total_players: 0,
            total_sessions: 0,
            total_matches: 0,
            total_goals: 0,
            avg_goals_per_match: 0,
            top_scorer: null,
            top_assistant: null,
            top_goalkeeper: null
        };
        
        players = [];
        
        // Tentar carregar estatísticas do dashboard
        try {
            console.log('Dashboard.js: Buscando estatísticas do dashboard...');
            const dashboardResponse = await fetch('/api/stats/dashboard');
            
            if (dashboardResponse.ok) {
                const responseData = await dashboardResponse.json();
                if (responseData) {
                    dashboardData = responseData;
                    console.log('Dashboard.js: Estatísticas do dashboard carregadas com sucesso');
                }
            } else {
                console.error('Dashboard.js: Erro ao buscar estatísticas:', dashboardResponse.status, dashboardResponse.statusText);
            }
        } catch (dashboardError) {
            console.error('Dashboard.js: Erro ao carregar estatísticas do dashboard:', dashboardError);
        }
        
        // Tentar carregar lista de jogadores
        try {
            console.log('Dashboard.js: Buscando lista de jogadores...');
            const playersResponse = await fetch('/api/stats/player_list');
            
            if (playersResponse.ok) {
                const responseData = await playersResponse.json();
                if (Array.isArray(responseData)) {
                    players = responseData;
                    console.log(`Dashboard.js: Lista de jogadores carregada com sucesso (${players.length} jogadores)`);
                }
            } else {
                console.error('Dashboard.js: Erro ao buscar jogadores:', playersResponse.status, playersResponse.statusText);
            }
        } catch (playersError) {
            console.error('Dashboard.js: Erro ao carregar lista de jogadores:', playersError);
        }
        
        // Atualizar a UI com os dados obtidos (mesmo que parciais)
        console.log('Dashboard.js: Atualizando interface com os dados disponíveis');
        updateDashboardUI(dashboardData);
        updatePlayersTable(players);
        
    } catch (error) {
        console.error('Dashboard.js: Erro geral ao carregar dados:', error);
        
        // Garantir que a UI seja renderizada mesmo com erro
        updateDashboardUI(dashboardData);
        updatePlayersTable(players);
        
        // Mostrar mensagem de erro se necessário
        if (typeof showError === 'function') {
            showError('Não foi possível carregar os dados completamente. Tente novamente mais tarde.');
        } else {
            console.error('Dashboard.js: Função showError não disponível');
        }
    } finally {
        showLoading(false);
        console.log('Dashboard.js: Carregamento de dados concluído');
    }
}

/**
 * Atualiza a interface do dashboard com os dados recebidos
 */
function updateDashboardUI(data) {
    // Atualizar destaque de artilheiro
    if (getTopScorerElement()) {
        if (data.top_scorer) {
            const playerName = data.top_scorer.name;
            const playerInitials = playerName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
            const playerImage = data.top_scorer.photo_url ? 
                `<img src="${data.top_scorer.photo_url}" alt="${playerName}" class="highlight-player-avatar">` : 
                `<div class="highlight-player-avatar highlight-player-initials">${playerInitials}</div>`;
            
            getTopScorerElement().innerHTML = `
                <div class="highlight-player">
                    ${playerImage}
                    <div class="highlight-player-info">
                        <div class="highlight-card-value">${data.top_scorer.name}</div>
                        <div>${data.top_scorer.goals} gols</div>
                    </div>
                </div>
            `;
        } else {
            getTopScorerElement().innerHTML = `
                <div class="highlight-card-value">Sem dados</div>
                <div>0 gols</div>
            `;
        }
    }
    
    // Atualizar destaque de assistente
    if (getTopAssistantElement()) {
        if (data.top_assistant) {
            const playerName = data.top_assistant.name;
            const playerInitials = playerName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
            const playerImage = data.top_assistant.photo_url ? 
                `<img src="${data.top_assistant.photo_url}" alt="${playerName}" class="highlight-player-avatar">` : 
                `<div class="highlight-player-avatar highlight-player-initials">${playerInitials}</div>`;
            
            getTopAssistantElement().innerHTML = `
                <div class="highlight-player">
                    ${playerImage}
                    <div class="highlight-player-info">
                        <div class="highlight-card-value">${data.top_assistant.name}</div>
                        <div>${data.top_assistant.assists} assistências</div>
                    </div>
                </div>
            `;
        } else {
            getTopAssistantElement().innerHTML = `
                <div class="highlight-card-value">Sem dados</div>
                <div>0 assistências</div>
            `;
        }
    }
    
    // Atualizar destaque de goleiro
    if (getTopGoalkeeperElement()) {
        if (data.top_goalkeeper) {
            const playerName = data.top_goalkeeper.name;
            const playerInitials = playerName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
            const playerImage = data.top_goalkeeper.photo_url ? 
                `<img src="${data.top_goalkeeper.photo_url}" alt="${playerName}" class="highlight-player-avatar">` : 
                `<div class="highlight-player-avatar highlight-player-initials">${playerInitials}</div>`;
            
            getTopGoalkeeperElement().innerHTML = `
                <div class="highlight-player">
                    ${playerImage}
                    <div class="highlight-player-info">
                        <div class="highlight-card-value">${data.top_goalkeeper.name}</div>
                        <div>${data.top_goalkeeper.goals_conceded} gols sofridos</div>
                        <div>Média: ${data.top_goalkeeper.average} por partida</div>
                    </div>
                </div>
            `;
        } else {
            getTopGoalkeeperElement().innerHTML = `
                <div class="highlight-card-value">Sem dados</div>
                <div>0 gols sofridos</div>
            `;
        }
    }
    
    // Atualizar contador de estatísticas gerais
    updateGeneralStats(data);
}

/**
 * Atualiza as estatísticas gerais na interface
 */
function updateGeneralStats(data) {
    const generalStatsElements = {
        'total-players': data.total_players || 0,
        'total-sessions': data.total_sessions || 0,
        'total-matches': data.total_matches || 0,
        'total-goals': data.total_goals || 0,
        'avg-goals': data.avg_goals_per_match || 0
    };
    
    for (const [id, value] of Object.entries(generalStatsElements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = typeof value === 'number' && !Number.isInteger(value) 
                ? value.toFixed(2) 
                : value;
        }
    }
}

/**
 * Atualiza a tabela de jogadores com as estatísticas
 */
function updatePlayersTable(players) {
    if (!getStatsTableBody()) return;
    
    // Ordenar jogadores conforme critério atual
    sortPlayerData(players);
    
    // Limpar tabela
    getStatsTableBody().innerHTML = '';
    
    // Adicionar jogadores à tabela
    players.forEach((player, index) => {
        const row = document.createElement('tr');
        
        // Criar um nome abreviado para dispositivos móveis
        const playerName = player.name;
        const shortName = abbreviateName(playerName);
        
        // Definir imagem do jogador ou iniciais se não houver imagem
        const playerInitials = playerName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
        const playerImage = player.photo_url ? 
            `<img src="${player.photo_url}" alt="${playerName}" class="player-avatar-small">` : 
            `<div class="player-avatar-small player-avatar-initials">${playerInitials}</div>`;
        
        // Criar células
        row.innerHTML = `
            <td class="text-center">${index + 1}</td>
            <td>
                <div class="player-info-row">
                    <div class="player-avatar-container">
                        ${playerImage}
                    </div>
                    <div class="player-data">
                        <div class="player-name-cell">
                            <span class="d-none d-md-inline">${playerName}</span>
                            <span class="d-inline d-md-none" title="${playerName}">${shortName}</span>
                            ${player.is_goalkeeper ? '<span class="badge badge-blue ml-1">G</span>' : ''}
                        </div>
                    </div>
                </div>
            </td>
            <td class="text-center">${player.goals}</td>
            <td class="text-center">${player.assists}</td>
            <td class="text-center">${player.goals_conceded}</td>
            <td class="text-center">${player.matches}</td>
            <td class="text-center d-none d-lg-table-cell">${player.sessions}</td>
        `;
        
        getStatsTableBody().appendChild(row);
    });
}

/**
 * Ordena a tabela com base na coluna selecionada
 */
function sortTable(column) {
    // Inverter direção se a mesma coluna for clicada novamente
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        // Gols, assistências e partidas são ordenados decrescentes por padrão
        currentSort.direction = ['goals', 'assists', 'matches'].includes(column) ? 'desc' : 'asc';
    }
    
    // Atualizar a interface com a nova ordenação
    sortPlayerData(players);
    updatePlayersTable(players);
    
    // Atualizar indicador visual da coluna ordenada
    updateSortIndicators();
}

/**
 * Ordena os dados dos jogadores com base no critério atual
 */
function sortPlayerData(data) {
    data.sort((a, b) => {
        let valueA = a[currentSort.column];
        let valueB = b[currentSort.column];
        
        // Comparar valores (string ou número)
        if (typeof valueA === 'string' && typeof valueB === 'string') {
            return currentSort.direction === 'asc' 
                ? valueA.localeCompare(valueB) 
                : valueB.localeCompare(valueA);
        } else {
            return currentSort.direction === 'asc' 
                ? valueA - valueB 
                : valueB - valueA;
        }
    });
}

/**
 * Atualiza os indicadores visuais de ordenação da tabela
 */
function updateSortIndicators() {
    const headers = getStatsTable().querySelectorAll('th[data-sort]');
    
    headers.forEach(header => {
        // Remover classes de ordenação
        header.classList.remove('sort-asc', 'sort-desc');
        
        // Adicionar classe apropriada
        if (header.getAttribute('data-sort') === currentSort.column) {
            header.classList.add(`sort-${currentSort.direction}`);
        }
    });
}

// Funções de autenticação gerenciadas pelo auth.js

/**
 * Controla a exibição do indicador de carregamento
 */
function showLoading(show) {
    if (getStatsLoader()) {
        getStatsLoader().style.display = show ? 'flex' : 'none';
    }
    
    if (getLoadingElement()) {
        getLoadingElement().style.display = show ? 'flex' : 'none';
    }
}

/**
 * Exibe uma mensagem de erro
 */
function showError(message) {
    // Implementar conforme necessário, por exemplo:
    alert(message);
}
