// Elementos do DOM
const settingsForm = document.getElementById('settings-form');
const matchDurationInput = document.getElementById('match-duration');
const masterPasswordInput = document.getElementById('master-password');
const togglePasswordButton = document.getElementById('toggle-password');
const resetDatabaseButton = document.getElementById('reset-database');
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
});

/**
 * Configura os event listeners
 */
function setupEventListeners() {
    // Toggle password visibility
    if (togglePasswordButton && masterPasswordInput) {
        togglePasswordButton.addEventListener('click', function() {
            const type = masterPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            masterPasswordInput.setAttribute('type', type);
            togglePasswordButton.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }

    // Form submit
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsSubmit);
    }

    // Reset database
    if (resetDatabaseButton) {
        resetDatabaseButton.addEventListener('click', function() {
            if (confirm('ATENÇÃO: Tem certeza que deseja resetar o banco de dados? Esta ação é irreversível!')) {
                fetch('/api/reset-database', {
                    method: 'POST'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Banco de dados resetado com sucesso!');
                        loadLogs();
                    } else {
                        alert('Erro ao resetar banco de dados: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Erro ao resetar banco:', error);
                    alert('Erro ao resetar banco de dados');
                });
            }
        });
    }
}

/**
 * Carrega as configurações do servidor
 */
async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        const data = await response.json();

        if (data.success) {
            matchDurationInput.value = data.settings.match_duration;
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

/**
 * Carrega os logs do sistema
 */
async function loadLogs() {
    try {
        const response = await fetch('/api/logs');
        const data = await response.json();

        const tbody = document.getElementById('logs-table-body');
        const noLogs = document.getElementById('no-logs');
        const loader = document.getElementById('logs-loader');

        if (data.success && data.logs) {
            tbody.innerHTML = data.logs.map(log => `
                <tr>
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                    <td>${log.event_type}</td>
                    <td>${log.description}</td>
                </tr>
            `).join('');

            noLogs.style.display = data.logs.length === 0 ? 'block' : 'none';
        }

        if (loader) {
            loader.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
    }
}

/**
 * Manipula o envio do formulário de configurações
 * @param {Event} event 
 */
async function handleSettingsSubmit(event) {
    event.preventDefault();

    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                match_duration: parseInt(matchDurationInput.value),
                master_password: masterPasswordInput.value
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Configurações salvas com sucesso!');
        } else {
            alert('Erro ao salvar configurações: ' + data.message);
        }
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        alert('Erro ao salvar configurações');
    }
}