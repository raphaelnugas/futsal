/**
 * Configurações - Futsal de Domingo
 * Script responsável pelo gerenciamento das configurações do sistema
 * 
 * Autor: Raphael Nugas
 * Data: 2023
 */

// Elementos do DOM que serão manipulados
const settingsForm = document.getElementById('settings-form');
const matchDurationField = document.getElementById('match-duration');
const masterPasswordField = document.getElementById('master-password');
const togglePasswordButton = document.getElementById('toggle-password');
const logsTableBody = document.getElementById('logs-table-body');
const logsLoader = document.getElementById('logs-loader');
const noLogsElement = document.getElementById('no-logs');
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
        settingsForm.addEventListener('submit', handleSaveSettings);
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
}

/**
 * Carrega as configurações do sistema
 */
async function loadSettings() {
    try {
        showLoading(true);
        
        const response = await fetch('/api/settings');
        settings = await response.json();
        
        // Preencher campos do formulário
        if (matchDurationField) {
            matchDurationField.value = settings.match_duration || 10;
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        showError('Não foi possível carregar as configurações do sistema.');
        showLoading(false);
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
        
        if (noLogsElement) {
            noLogsElement.style.display = 'block';
            noLogsElement.textContent = 'Erro ao carregar logs. Tente novamente.';
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
    if (!logsTableBody || !noLogsElement) return;
    
    if (logs.length === 0) {
        logsTableBody.innerHTML = '';
        noLogsElement.style.display = 'block';
        return;
    }
    
    noLogsElement.style.display = 'none';
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
async function handleSaveSettings(event) {
    event.preventDefault();
    
    const matchDuration = parseInt(matchDurationField.value);
    const masterPassword = masterPasswordField.value;
    
    // Validar campos
    if (isNaN(matchDuration) || matchDuration < 1 || matchDuration > 60) {
        showError('A duração da partida deve ser entre 1 e 60 minutos.');
        return;
    }
    
    // Preparar dados
    const data = {
        match_duration: matchDuration
    };
    
    // Adicionar senha mestra se foi preenchida
    if (masterPassword) {
        data.master_password = masterPassword;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const responseData = await response.json();
        
        if (responseData.success) {
            // Limpar campo de senha
            if (masterPasswordField) {
                masterPasswordField.value = '';
            }
            
            // Mostrar mensagem de sucesso
            if (successMessage) {
                successMessage.textContent = 'Configurações salvas com sucesso!';
            }
            
            toggleModal('success-modal', true);
        } else {
            showError(responseData.message || 'Erro ao salvar configurações.');
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showError('Erro ao conectar com o servidor. Tente novamente.');
        showLoading(false);
    }
}

/**
 * Alterna a visibilidade da senha
 */
function togglePasswordVisibility() {
    if (!masterPasswordField || !togglePasswordButton) return;
    
    if (masterPasswordField.type === 'password') {
        masterPasswordField.type = 'text';
        togglePasswordButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        masterPasswordField.type = 'password';
        togglePasswordButton.innerHTML = '<i class="fas fa-eye"></i>';
    }
}
