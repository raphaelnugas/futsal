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
    
    // Evento para fechar o modal ao clicar fora
    if (loginModal) {
        loginModal.addEventListener('click', (event) => {
            if (event.target === loginModal) {
                toggleLoginModal(false);
            }
        });
    }
}

/**
 * Exibe/oculta o modal de login
 * @param {boolean} show - Se deve mostrar ou esconder o modal
 */
function toggleLoginModal(show) {
    if (!loginModal) return;
    
    if (show) {
        loginModal.classList.add('active');
        // Focar no campo de senha
        setTimeout(() => {
            const passwordField = document.getElementById('password');
            if (passwordField) passwordField.focus();
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
 * @param {Event} event - Evento de submit
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const passwordField = document.getElementById('password');
    if (!passwordField) return;
    
    const password = passwordField.value;
    
    // Validação básica
    if (!password) {
        if (loginError) loginError.textContent = 'Digite a senha.';
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
            if (loginError) loginError.textContent = data.message || 'Senha incorreta.';
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        if (loginError) loginError.textContent = 'Erro ao conectar. Tente novamente.';
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
