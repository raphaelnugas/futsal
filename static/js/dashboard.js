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
const loginButton = document.getElementById('login-button');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const closeModalButton = document.getElementById('close-modal');
const logoutButton = document.getElementById('logout-button');
const loadingElement = document.getElementById('loading');
const searchInput = document.getElementById('search-player');
const filterButtons = document.querySelectorAll('.filter-btn');

// Estado da aplicação
let players = [];
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
    // Evento para o botão de login
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            toggleLoginModal(true);
        });
    }
    
    // Evento para o botão de fechar o modal
    if (closeModalButton) {
        closeModalButton.addEventListener('click', () => {
            toggleLoginModal(false);
        });
    }
    
    // Evento para o formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Evento para o botão de logout
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Evento para o input de busca
    if (searchInput) {
        searchInput.addEventListener('input', filterPlayers);
    }
    
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
        const dashboardData = await dashboardResponse.json();
        
        // Carregar lista de jogadores com estatísticas
        const playersResponse = await fetch('/api/stats/player_list');
        players = await playersResponse.json();
        
        // Atualizar a UI com os dados
        updateDashboardUI(dashboardData);
        updatePlayersTable(players);
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        showError('Não foi possível carregar os dados. Tente novamente mais tarde.');
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

/**
 * Filtra os jogadores com base no texto digitado na busca
 */
function filterPlayers() {
    const searchText = searchInput.value.toLowerCase();
    
    if (!searchText) {
        // Se a busca estiver vazia, mostrar todos
        updatePlayersTable(players);
        return;
    }
    
    // Filtrar jogadores pelo nome
    const filteredPlayers = players.filter(player => 
        player.name.toLowerCase().includes(searchText)
    );
    
    // Atualizar tabela com jogadores filtrados
    updatePlayersTable(filteredPlayers);
}

/**
 * Controla a exibição do modal de login
 */
function toggleLoginModal(show) {
    if (!loginModal) return;
    
    if (show) {
        loginModal.classList.add('active');
        // Focar no campo de senha
        setTimeout(() => {
            document.getElementById('password').focus();
        }, 100);
    } else {
        loginModal.classList.remove('active');
        // Limpar campos
        if (loginForm) loginForm.reset();
        if (loginError) loginError.textContent = '';
    }
}

/**
 * Manipula o envio do formulário de login
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const password = document.getElementById('password').value;
    
    // Validação básica
    if (!password) {
        loginError.textContent = 'Digite a senha.';
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Login bem-sucedido
            toggleLoginModal(false);
            // Recarregar a página para atualizar estado de autenticação
            window.location.reload();
        } else {
            // Exibir mensagem de erro
            loginError.textContent = data.message || 'Senha incorreta.';
        }
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        loginError.textContent = 'Erro ao conectar. Tente novamente.';
    }
}

/**
 * Manipula o logout
 */
async function handleLogout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Logout bem-sucedido
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Erro ao realizar logout:', error);
        showError('Erro ao sair. Tente novamente.');
    }
}

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
