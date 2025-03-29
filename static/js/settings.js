/**
 * Configurações - Futsal de Domingo
 * Script responsável pelo gerenciamento das configurações do sistema
 * 
 * Autor: Raphael Nugas
 * Data: 2023
 */

// Elementos do DOM
const settingsForm = document.getElementById('settings-form');
const matchDurationInput = document.getElementById('match-duration');
const masterPasswordInput = document.getElementById('master-password');
const togglePasswordButton = document.getElementById('toggle-password');
const resetDatabaseButton = document.getElementById('reset-database');
const logsTableBody = document.getElementById('logs-table-body');
const logsLoader = document.getElementById('logs-loader');
const noLogs = document.getElementById('no-logs');
const successModal = document.getElementById('success-modal');
const closeSuccessModal = document.getElementById('close-success-modal');
const successMessage = document.getElementById('success-message');
const confirmSuccessButton = document.getElementById('confirm-success');

// Estado da aplicação
let settings = null;
let logs = [];

/**
 * Inicialização
 */
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados
    loadSettings();
    loadLogs();

    // Configurar eventos
    setupEventListeners();
});

/**
 * Configura os listeners de eventos
 */
function setupEventListeners() {
    // Evento para o formulário de configurações
    if (settingsForm) {
        settingsForm.addEventListener('submit', saveSettings);
    }

    // Evento para mostrar/ocultar senha
    if (togglePasswordButton) {
        togglePasswordButton.addEventListener('click', togglePasswordVisibility);
    }

    // Eventos para o modal de sucesso
    if (closeSuccessModal) {
        closeSuccessModal.addEventListener('click', () => toggleModal('success-modal', false));
    }

    if (confirmSuccessButton) {
        confirmSuccessButton.addEventListener('click', () => toggleModal('success-modal', false));
    }

    // Fechar modal ao clicar fora
    setupModalOutsideClick('success-modal');

    // Event listener for reset button
    if (resetDatabaseButton) {
        resetDatabaseButton.addEventListener('click', resetDatabase);
    }
}

/**
 * Carrega as configurações do sistema
 */
async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error('Erro ao carregar configurações');

        const settings = await response.json();
        matchDurationInput.value = settings.match_duration || '';
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        showError('Erro ao carregar configurações');
    }
}

/**
 * Carrega os logs do sistema
 */
async function loadLogs() {
    try {
        if (logsLoader) {
            logsLoader.style.display = 'flex';
        }

        const response = await fetch('/api/logs');
        logs = await response.json();

        // Atualizar tabela de logs
        updateLogsTable();

        if (logsLoader) {
            logsLoader.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao carregar logs:', error);

        if (noLogs) {
            noLogs.style.display = 'block';
            noLogs.textContent = 'Erro ao carregar logs. Tente novamente.';
        }

        if (logsLoader) {
            logsLoader.style.display = 'none';
        }
    }
}

/**
 * Atualiza a tabela de logs
 */
function updateLogsTable() {
    if (!logsTableBody || !noLogs) return;

    if (logs.length === 0) {
        logsTableBody.innerHTML = '';
        noLogs.style.display = 'block';
        return;
    }

    noLogs.style.display = 'none';
    logsTableBody.innerHTML = '';

    // Criar linha para cada log
    logs.forEach(log => {
        const row = document.createElement('tr');

        const timestamp = new Date(log.timestamp);
        const formattedDate = formatDate(log.timestamp, true);

        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${formatEventType(log.event_type)}</td>
            <td>${log.description || ''}</td>
        `;

        logsTableBody.appendChild(row);
    });
}

/**
 * Manipula o envio do formulário de configurações
 */
async function saveSettings(event) {
    event.preventDefault();

    const data = {
        match_duration: parseInt(matchDurationInput.value),
        master_password: masterPasswordInput.value
    };

    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Erro ao salvar configurações');

        showSuccess('Configurações salvas com sucesso!');
        masterPasswordInput.value = '';
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showError('Erro ao salvar configurações');
    }
}

/**
 * Alterna a visibilidade da senha
 */
function togglePasswordVisibility() {
    const type = masterPasswordInput.type === 'password' ? 'text' : 'password';
    masterPasswordInput.type = type;
    togglePasswordButton.innerHTML = `<i class="fas fa-eye${type === 'password' ? '' : '-slash'}"></i>`;
}

// Reset do banco de dados
async function resetDatabase() {
    if (!confirm('ATENÇÃO: Esta ação irá apagar todos os dados do sistema! Deseja continuar?')) {
        return;
    }

    try {
        const response = await fetch('/api/reset-database', {
            method: 'POST'
        });

        if (!response.ok) throw new Error('Erro ao resetar banco de dados');

        showSuccess('Banco de dados resetado com sucesso!');
        setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
        console.error('Erro ao resetar banco de dados:', error);
        showError('Erro ao resetar banco de dados');
    }
}


// Placeholder functions -  These need to be defined elsewhere in your project.
function showError(message) {
    //Implementation to show error message
    console.error(message)
}

function showSuccess(message) {
    //Implementation to show success message
    console.log(message)
}

function toggleModal(modalId, show) {
    //Implementation to show/hide modal
    console.log(`modal ${modalId} toggled to ${show}`)
}

function setupModalOutsideClick(modalId) {
    //Implementation to close modal on outside click
    console.log(`setup outside click for modal ${modalId}`)
}

function formatDate(timestamp, withTime) {
    //Implementation for date formatting
    return new Date(timestamp).toLocaleString()
}

function formatEventType(eventType) {
    //Implementation for event type formatting
    return eventType
}