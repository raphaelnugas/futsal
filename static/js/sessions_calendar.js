/**
 * Calendário de Sessões - Futsal de Domingo
 * Script responsável pelo gerenciamento do calendário de sessões
 * 
 * Autor: Raphael Nugas
 * Data: 2023
 */

// Elementos do DOM que serão manipulados
const nextSundaysContainer = document.getElementById('next-sundays-container');
const previousSessionsContainer = document.getElementById('previous-sessions-container');
const activeSessionContainer = document.getElementById('active-session-container');
const activeSessionInfo = document.getElementById('active-session-info');
const activeSessionLink = document.getElementById('active-session-link');
const createSessionModal = document.getElementById('create-session-modal');
const closeCreateSessionModal = document.getElementById('close-create-session-modal');
const sessionDateDisplay = document.getElementById('session-date-display');
const activeSessionWarning = document.getElementById('active-session-warning');
const cancelCreateSession = document.getElementById('cancel-create-session');
const confirmCreateSession = document.getElementById('confirm-create-session');

// Estado da aplicação
let nextSundays = [];
let previousSessions = [];
let activeSession = null;
let selectedDate = null;

/**
 * Inicialização
 */
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados
    loadCalendarData();
    
    // Configurar eventos
    setupEventListeners();
});

/**
 * Configura os listeners de eventos
 */
function setupEventListeners() {
    // Fechar modal de criação
    if (closeCreateSessionModal) {
        closeCreateSessionModal.addEventListener('click', () => {
            toggleModal('create-session-modal', false);
        });
    }
    
    // Cancelar criação
    if (cancelCreateSession) {
        cancelCreateSession.addEventListener('click', () => {
            toggleModal('create-session-modal', false);
        });
    }
    
    // Confirmar criação
    if (confirmCreateSession) {
        confirmCreateSession.addEventListener('click', createSession);
    }
    
    // Fechar modal ao clicar fora
    setupModalOutsideClick('create-session-modal');
}

/**
 * Carrega os dados do calendário
 */
async function loadCalendarData() {
    try {
        showLoading(true);
        
        // Carregar próximos domingos
        const sunResponse = await fetch('/api/sessions/next-sundays');
        nextSundays = await sunResponse.json();
        
        // Carregar sessões anteriores
        const sessionsResponse = await fetch('/api/sessions');
        const allSessions = await sessionsResponse.json();
        
        // Separar a sessão ativa e as anteriores
        activeSession = allSessions.find(s => s.is_active);
        previousSessions = allSessions.filter(s => !s.is_active).sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        // Atualizar UI
        renderCalendar();
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar dados do calendário:', error);
        showError('Não foi possível carregar o calendário.');
        showLoading(false);
    }
}

/**
 * Renderiza o calendário na interface
 */
function renderCalendar() {
    // Exibir sessão ativa, se houver
    renderActiveSession();
    
    // Exibir próximos domingos
    renderNextSundays();
    
    // Exibir sessões anteriores
    renderPreviousSessions();
}

/**
 * Renderiza a sessão ativa
 */
function renderActiveSession() {
    if (!activeSessionContainer || !activeSessionInfo || !activeSessionLink) return;
    
    if (activeSession) {
        activeSessionContainer.style.display = 'block';
        
        const sessionDate = formatDate(activeSession.date);
        const startTime = formatDate(activeSession.start_time, true);
        
        activeSessionInfo.innerHTML = `
            <p><strong>Data:</strong> ${sessionDate}</p>
            <p><strong>Início:</strong> ${startTime}</p>
            <p><strong>Partidas:</strong> ${activeSession.match_count}</p>
        `;
        
        activeSessionLink.href = `/session/${activeSession.date}`;
    } else {
        activeSessionContainer.style.display = 'none';
    }
}

/**
 * Renderiza os próximos domingos
 */
function renderNextSundays() {
    if (!nextSundaysContainer) return;
    
    if (nextSundays.length === 0) {
        nextSundaysContainer.innerHTML = `
            <div class="text-center py-3">
                <p class="text-muted">Nenhum domingo disponível.</p>
            </div>
        `;
        return;
    }
    
    nextSundaysContainer.innerHTML = '';
    
    // Criar item para cada domingo
    nextSundays.forEach(sunday => {
        const sundayItem = document.createElement('div');
        sundayItem.className = `sunday-item ${sunday.exists ? 'exists' : ''}`;
        
        const date = new Date(sunday.date);
        const formattedDate = formatDate(sunday.date);
        
        sundayItem.innerHTML = `
            <div class="sunday-date">${formattedDate}</div>
            <div>
                ${sunday.exists
                    ? `<a href="/session/${sunday.date}" class="btn btn-primary btn-sm">Ver Sessão</a>`
                    : `<button class="btn btn-success btn-sm create-session-btn" data-date="${sunday.date}">Criar Sessão</button>`
                }
            </div>
        `;
        
        nextSundaysContainer.appendChild(sundayItem);
        
        // Adicionar evento ao botão de criar sessão
        const createBtn = sundayItem.querySelector('.create-session-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => openCreateSessionModal(sunday.date));
        }
    });
}

/**
 * Renderiza as sessões anteriores
 */
function renderPreviousSessions() {
    if (!previousSessionsContainer) return;
    
    if (previousSessions.length === 0) {
        previousSessionsContainer.innerHTML = `
            <div class="text-center py-3">
                <p class="text-muted">Nenhuma sessão anterior.</p>
            </div>
        `;
        return;
    }
    
    previousSessionsContainer.innerHTML = '';
    
    // Criar item para cada sessão anterior
    previousSessions.forEach(session => {
        const sessionItem = document.createElement('div');
        sessionItem.className = 'sunday-item';
        
        const sessionDate = formatDate(session.date);
        const startTime = formatDate(session.start_time, true);
        const endTime = formatDate(session.end_time, true);
        
        sessionItem.innerHTML = `
            <div>
                <div class="sunday-date">${sessionDate}</div>
                <div class="text-muted">
                    <small>Início: ${startTime}</small>
                    <small class="ms-2">Partidas: ${session.match_count}</small>
                </div>
            </div>
            <div>
                <a href="/session/${session.date}" class="btn btn-outline-primary btn-sm">Ver Detalhes</a>
            </div>
        `;
        
        previousSessionsContainer.appendChild(sessionItem);
    });
}

/**
 * Abre o modal para criar uma nova sessão
 * @param {string} date - Data da sessão no formato ISO
 */
function openCreateSessionModal(date) {
    if (!createSessionModal || !sessionDateDisplay || !activeSessionWarning) return;
    
    selectedDate = date;
    
    // Formatar a data para exibição
    const formattedDate = formatDate(date);
    sessionDateDisplay.textContent = formattedDate;
    
    // Exibir aviso se houver sessão ativa
    if (activeSession) {
        activeSessionWarning.style.display = 'block';
    } else {
        activeSessionWarning.style.display = 'none';
    }
    
    // Exibir o modal
    toggleModal('create-session-modal', true);
}

/**
 * Cria uma nova sessão
 */
async function createSession() {
    if (!selectedDate) {
        showError('Nenhuma data selecionada.');
        return;
    }
    
    try {
        showLoading(true);
        toggleModal('create-session-modal', false);
        
        const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date: selectedDate })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Redirecionar para a nova sessão
            window.location.href = `/session/${selectedDate}`;
        } else {
            showError(data.message || 'Erro ao criar sessão.');
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao criar sessão:', error);
        showError('Erro ao conectar com o servidor. Tente novamente.');
        showLoading(false);
    }
}
