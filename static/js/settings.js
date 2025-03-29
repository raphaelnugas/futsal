
/**
 * Configurações - Futsal de Domingo
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
const confirmSuccessButton = document.getElementById('confirm-success');
const successMessage = document.getElementById('success-message');

/**
 * Inicialização
 */
document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados
    loadSettings();
    loadLogs();

    // Configurar eventos
    setupEventListeners();

    if (togglePasswordButton && masterPasswordInput) {
        togglePasswordButton.addEventListener('click', function() {
            const type = masterPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            masterPasswordInput.setAttribute('type', type);
            togglePasswordButton.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }
});

/**
 * Configura os event listeners
 */
function setupEventListeners() {
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsSubmit);
    }

    if (resetDatabaseButton) {
        resetDatabaseButton.addEventListener('click', resetDatabase);
    }

    if (closeSuccessModal) {
        closeSuccessModal.addEventListener('click', () => successModal.style.display = 'none');
    }

    if (confirmSuccessButton) {
        confirmSuccessButton.addEventListener('click', () => successModal.style.display = 'none');
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
        if (settings) {
            matchDurationInput.value = settings.match_duration || '';
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        showError('Erro ao carregar configurações');
    }
}

/**
 * Salva as configurações do sistema
 */
async function handleSettingsSubmit(event) {
    event.preventDefault();
    
    const data = {
        match_duration: parseInt(matchDurationInput.value),
        master_password: masterPasswordInput.value
    };

    try {
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Erro ao salvar configurações');

        showSuccess('Configurações salvas com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showError('Erro ao salvar configurações');
    }
}

/**
 * Reseta o banco de dados
 */
async function resetDatabase() {
    if (!confirm('ATENÇÃO: Esta ação irá apagar todos os dados do sistema! Deseja continuar?')) {
        return;
    }

    try {
        const response = await fetch('/api/reset-database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Erro ao resetar banco de dados');

        const data = await response.json();
        if (data.success) {
            showSuccess('Banco de dados resetado com sucesso!');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            throw new Error(data.message || 'Erro ao resetar banco de dados');
        }
    } catch (error) {
        console.error('Erro ao resetar banco de dados:', error);
        showError('Erro ao resetar banco de dados');
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
        if (!response.ok) throw new Error('Erro ao carregar logs');

        const logs = await response.json();
        updateLogsTable(logs);
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
        showError('Erro ao carregar logs');
    } finally {
        if (logsLoader) {
            logsLoader.style.display = 'none';
        }
    }
}

/**
 * Atualiza a tabela de logs
 */
function updateLogsTable(logs) {
    if (!logsTableBody) return;

    if (!logs || logs.length === 0) {
        if (noLogs) noLogs.style.display = 'block';
        return;
    }

    logsTableBody.innerHTML = logs.map(log => `
        <tr>
            <td>${formatDate(log.timestamp)}</td>
            <td>${formatEventType(log.event_type)}</td>
            <td>${log.description || '-'}</td>
        </tr>
    `).join('');
}

/**
 * Exibe mensagem de sucesso
 */
function showSuccess(message) {
    if (successMessage && successModal) {
        successMessage.textContent = message;
        successModal.style.display = 'flex';
    }
}

/**
 * Exibe mensagem de erro
 */
function showError(message) {
    alert(message);
}

/**
 * Formata data para exibição
 */
function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString();
}

/**
 * Formata tipo de evento para exibição
 */
function formatEventType(eventType) {
    const eventTypeMap = {
        'session_start': 'Início de Sessão',
        'session_end': 'Fim de Sessão',
        'match_start': 'Início de Partida',
        'match_end': 'Fim de Partida',
        'goal': 'Gol',
        'goal_deleted': 'Gol Removido',
        'players_updated': 'Jogadores Atualizados'
    };
    return eventTypeMap[eventType] || eventType;
}
