/**
 * Dashboard do Futsal de Domingo
 * Script responsável pelo gerenciamento da página principal com estatísticas
 * 
 * Autor: Raphael Nugas
 * Data: 2023
 */

// Elementos do DOM que serão manipulados
const topScorerElement = document.getElementById('top-scorer');
const topAssistantElement = document.getElementById('top-assistant');
const topGoalkeeperElement = document.getElementById('top-goalkeeper');
const statsTableBody = document.getElementById('stats-table-body');
const statsLoader = document.getElementById('stats-loader');
const statsTable = document.getElementById('stats-table');
const loadingElement = document.getElementById('loading');
// Autenticação gerenciada pelo auth.js, não declarando os elementos aqui

const filterButtons = document.querySelectorAll('.filter-btn');

// Estado da aplicação
let players = [];
let dashboardData = null;
let currentSort = {
    column: 'goals',
    direction: 'desc'
};

/**
 * Inicialização do Dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados para o dashboard
    loadDashboardData();
    
    // Adicionar eventos aos elementos
    setupEventListeners();
});

/**
 * Configura os listeners de eventos
 */
function setupEventListeners() {
    // Eventos de autenticação gerenciados pelo auth.js
    

    
    // Eventos para os botões de filtro
    if (filterButtons) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const column = button.getAttribute('data-filter');
                sortTable(column);
                
                // Atualizar classe ativa nos botões
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }
    
    // Eventos para clicar nas colunas da tabela
    if (statsTable) {
        const headers = statsTable.querySelectorAll('th');
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
    try {
        showLoading(true);
        
        // Carregar estatísticas do dashboard
        const dashboardResponse = await fetch('/api/stats/dashboard');
        dashboardData = await dashboardResponse.json();
        
        if (!dashboardData) {
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
        }
        
        // Carregar lista de jogadores com estatísticas
        const playersResponse = await fetch('/api/stats/player_list');
        players = await playersResponse.json();
        
        if (!Array.isArray(players)) {
            players = [];
        }
        
        // Atualizar a UI com os dados
        updateDashboardUI(dashboardData);
        updatePlayersTable(players);
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        showError('Não foi possível carregar os dados. Tente novamente mais tarde.');
        
        // Se tiver erro, ainda tentar montar UI com dados vazios
        players = [];
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
        
        updateDashboardUI(dashboardData);
        updatePlayersTable(players);
        
        showLoading(false);
    }
}

/**
 * Atualiza a interface do dashboard com os dados recebidos
 */
function updateDashboardUI(data) {
    // Atualizar destaque de artilheiro
    if (topScorerElement) {
        if (data.top_scorer) {
            topScorerElement.innerHTML = `
                <div class="highlight-card-value">${data.top_scorer.name}</div>
                <div>${data.top_scorer.goals} gols</div>
            `;
        } else {
            topScorerElement.innerHTML = `
                <div class="highlight-card-value">Sem dados</div>
                <div>0 gols</div>
            `;
        }
    }
    
    // Atualizar destaque de assistente
    if (topAssistantElement) {
        if (data.top_assistant) {
            topAssistantElement.innerHTML = `
                <div class="highlight-card-value">${data.top_assistant.name}</div>
                <div>${data.top_assistant.assists} assistências</div>
            `;
        } else {
            topAssistantElement.innerHTML = `
                <div class="highlight-card-value">Sem dados</div>
                <div>0 assistências</div>
            `;
        }
    }
    
    // Atualizar destaque de goleiro
    if (topGoalkeeperElement) {
        if (data.top_goalkeeper) {
            topGoalkeeperElement.innerHTML = `
                <div class="highlight-card-value">${data.top_goalkeeper.name}</div>
                <div>${data.top_goalkeeper.goals_conceded} gols sofridos</div>
                <div>Média: ${data.top_goalkeeper.average} por partida</div>
            `;
        } else {
            topGoalkeeperElement.innerHTML = `
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
    if (!statsTableBody) return;
    
    // Ordenar jogadores conforme critério atual
    sortPlayerData(players);
    
    // Limpar tabela
    statsTableBody.innerHTML = '';
    
    // Adicionar jogadores à tabela
    players.forEach((player, index) => {
        const row = document.createElement('tr');
        
        // Criar células
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                ${player.name}
                ${player.is_goalkeeper ? '<span class="badge badge-blue ml-1">G</span>' : ''}
            </td>
            <td>${player.goals}</td>
            <td>${player.assists}</td>
            <td>${player.is_goalkeeper ? player.goals_conceded : '-'}</td>
            <td>${player.matches}</td>
            <td>${player.sessions}</td>
        `;
        
        statsTableBody.appendChild(row);
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
        
        // Tratar casos especiais
        if (currentSort.column === 'goals_conceded' && !a.is_goalkeeper) valueA = Infinity;
        if (currentSort.column === 'goals_conceded' && !b.is_goalkeeper) valueB = Infinity;
        
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
    const headers = statsTable.querySelectorAll('th[data-sort]');
    
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
    if (statsLoader) {
        statsLoader.style.display = show ? 'flex' : 'none';
    }
    
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Exibe uma mensagem de erro
 */
function showError(message) {
    // Implementar conforme necessário, por exemplo:
    alert(message);
}
