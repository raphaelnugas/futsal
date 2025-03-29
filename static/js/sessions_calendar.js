/**
 * Calendário de Sessões - Futsal de Domingo
 * Script responsável pelo gerenciamento do calendário de sessões
 * 
 * Autor: Raphael Nugas
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
const calendarMonthYear = document.getElementById('calendar-month-year');
const calendarDaysGrid = document.getElementById('calendar-days-grid');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

// Estado da aplicação
let nextSundays = [];
let previousSessions = [];
let activeSession = null;
let selectedDate = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let allSessions = [];

// Nomes dos meses em português
const monthNames = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

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
    // Inicializar o modal Bootstrap se o elemento existir
    if (createSessionModal) {
        try {
            createSessionModal.bsModal = new bootstrap.Modal(createSessionModal);
        } catch (error) {
            console.error('Erro ao inicializar o modal Bootstrap:', error);
        }
    }
    
    // Confirmar criação
    if (confirmCreateSession) {
        confirmCreateSession.addEventListener('click', createSession);
    }
    
    // Navegação do calendário
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', goToPreviousMonth);
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', goToNextMonth);
    }
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
        
        // Carregar todas as sessões (presentes e passadas)
        const sessionsResponse = await fetch('/api/sessions');
        allSessions = await sessionsResponse.json();
        
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
    
    // Renderizar o calendário visual
    renderCalendarMonth();
    
    // Exibir próximos domingos
    renderNextSundays();
    
    // Exibir sessões anteriores
    renderPreviousSessions();
}

/**
 * Renderiza o calendário visual do mês atual
 */
function renderCalendarMonth() {
    if (!calendarMonthYear || !calendarDaysGrid) return;
    
    // Atualizar título do mês
    calendarMonthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Obter o primeiro dia do mês
    const firstDay = new Date(currentYear, currentMonth, 1);
    // Obter o último dia do mês
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Dia da semana do primeiro dia (0 = Domingo, 1 = Segunda, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Número total de dias no mês
    const totalDays = lastDay.getDate();
    
    // Limpar o grid atual
    calendarDaysGrid.innerHTML = '';
    
    // Adicionar dias do mês anterior
    for (let i = 0; i < firstDayOfWeek; i++) {
        const prevMonth = new Date(currentYear, currentMonth, 0);
        const prevMonthDay = prevMonth.getDate() - firstDayOfWeek + i + 1;
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.textContent = prevMonthDay;
        
        calendarDaysGrid.appendChild(dayDiv);
    }
    
    // Adicionar dias do mês atual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(currentYear, currentMonth, day);
        
        // Verificar se é domingo (0)
        const isSunday = date.getDay() === 0;
        
        // Verificar se é hoje
        const isToday = date.getTime() === today.getTime();
        
        // Verificar se é passado
        const isPast = date < today;
        
        // Verificar se há sessão neste dia
        const sessionForDay = allSessions.find(s => {
            const sessionDate = new Date(s.date);
            return sessionDate.getDate() === day && 
                   sessionDate.getMonth() === currentMonth && 
                   sessionDate.getFullYear() === currentYear;
        });
        
        const hasSession = sessionForDay !== undefined;
        const isActiveSession = hasSession && sessionForDay.is_active;
        
        // Criar o elemento do dia
        const dayDiv = document.createElement('div');
        dayDiv.textContent = day;
        
        // Adicionar classes com base nas condições
        dayDiv.className = `calendar-day 
                           ${isSunday ? 'sunday' : ''} 
                           ${isToday ? 'today' : ''} 
                           ${isPast ? 'past' : ''} 
                           ${hasSession ? 'has-session' : ''} 
                           ${isActiveSession ? 'active' : ''} 
                           ${(isSunday || hasSession) ? 'selectable' : ''}`;
        
        // Adicionar data como atributo (formato ISO para usar depois)
        const dateIso = date.toISOString().split('T')[0];
        dayDiv.setAttribute('data-date', dateIso);
        
        // Adicionar evento de clique para domingos ou dias com sessão
        if (isSunday || hasSession) {
            dayDiv.addEventListener('click', () => handleDayClick(dateIso, hasSession));
        }
        
        calendarDaysGrid.appendChild(dayDiv);
    }
    
    // Adicionar dias do próximo mês para completar a última semana
    const totalCells = firstDayOfWeek + totalDays;
    const remainingCells = 7 - (totalCells % 7);
    
    // Só adiciona se for necessário completar a semana (e não for um múltiplo exato de 7)
    if (remainingCells < 7) {
        for (let i = 1; i <= remainingCells; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.textContent = i;
            
            calendarDaysGrid.appendChild(dayDiv);
        }
    }
}

/**
 * Manipula o clique em um dia do calendário
 */
function handleDayClick(dateStr, hasSession) {
    if (hasSession) {
        // Se já tem sessão, redireciona para a página da sessão
        window.location.href = `/session/${dateStr}`;
    } else {
        // Se não tem sessão e é um domingo, abre modal para criar
        openCreateSessionModal(dateStr);
    }
}

/**
 * Navega para o mês anterior
 */
function goToPreviousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    
    renderCalendarMonth();
}

/**
 * Navega para o próximo mês
 */
function goToNextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    
    renderCalendarMonth();
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
    
    // Criar a instância do modal Bootstrap se ainda não existir
    if (!createSessionModal.bsModal) {
        try {
            createSessionModal.bsModal = new bootstrap.Modal(createSessionModal);
        } catch (error) {
            console.error('Erro ao criar a instância do Bootstrap Modal:', error);
            return;
        }
    }
    
    // Exibir o modal
    createSessionModal.bsModal.show();
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
        
        // Fechar o modal usando a API do Bootstrap
        if (createSessionModal && createSessionModal.bsModal) {
            createSessionModal.bsModal.hide();
        }
        
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
