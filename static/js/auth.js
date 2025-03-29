/**
 * Autenticação - Futsal de Domingo
 * Script responsável pelo gerenciamento de login/logout
 * 
 * Autor: Raphael Nugas
 * Data: 2023
 */

// Elementos do DOM que serão manipulados
const loginButton = document.getElementById('login-button');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const closeModalButton = document.getElementById('close-modal');
const logoutButton = document.getElementById('logout-button');

// Variável para armazenar a instância do modal Bootstrap
let bsLoginModal = null;

/**
 * Inicialização
 */
document.addEventListener('DOMContentLoaded', () => {
    // Configurar eventos apenas se os elementos existirem
    setupAuthEventListeners();
});

/**
 * Configura os listeners de eventos para autenticação
 */
function setupAuthEventListeners() {
    // Inicializar o modal Bootstrap se o elemento existir
    if (loginModal) {
        try {
            bsLoginModal = new bootstrap.Modal(loginModal);
            
            // Configurar evento para focar o campo de senha quando o modal for mostrado
            loginModal.addEventListener('shown.bs.modal', function () {
                const passwordField = document.getElementById('password');
                if (passwordField) passwordField.focus();
            });
        } catch (error) {
            console.error('Erro ao inicializar o modal:', error);
        }
    }
    
    // Evento para o botão de login
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            toggleLoginModal(true);
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
}

/**
 * Exibe/oculta o modal de login usando Bootstrap
 * @param {boolean} show - Se deve mostrar ou esconder o modal
 */
function toggleLoginModal(show) {
    if (!loginModal) {
        console.error('Modal de login não encontrado');
        return;
    }
    
    // Criar a instância do modal se ainda não existir
    if (!bsLoginModal) {
        try {
            bsLoginModal = new bootstrap.Modal(loginModal);
        } catch (error) {
            console.error('Erro ao criar instância do Bootstrap Modal:', error);
            return;
        }
    }
    
    if (show) {
        // Mostrar o modal usando a instância já criada
        bsLoginModal.show();
    } else {
        // Esconder o modal
        bsLoginModal.hide();
        
        // Limpar campos
        if (loginForm) loginForm.reset();
        if (loginError) {
            loginError.textContent = '';
            loginError.style.display = 'none';
        }
    }
}

/**
 * Manipula o envio do formulário de login
 * @param {Event} event - Evento de submit
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const passwordField = document.getElementById('password');
    if (!passwordField) return;
    
    const password = passwordField.value;
    
    // Validação básica
    if (!password) {
        if (loginError) {
            loginError.textContent = 'Digite a senha.';
            loginError.style.display = 'block';
        }
        return;
    }
    
    try {
        showLoading(true);
        
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
            if (loginError) {
                loginError.textContent = data.message || 'Senha incorreta.';
                loginError.style.display = 'block';
            }
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        if (loginError) {
            loginError.textContent = 'Erro ao conectar. Tente novamente.';
            loginError.style.display = 'block';
        }
        showLoading(false);
    }
}

/**
 * Manipula o logout
 */
async function handleLogout() {
    try {
        showLoading(true);
        
        const response = await fetch('/api/logout', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Logout bem-sucedido
            window.location.href = '/';
        } else {
            showError('Erro ao sair: ' + (data.message || 'Tente novamente.'));
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao realizar logout:', error);
        showError('Erro ao sair. Tente novamente.');
        showLoading(false);
    }
}
