/**
 * Autenticação - Futsal de Domingo
 * Script responsável pelo gerenciamento de login/logout
 * 
 * Autor: Raphael Nugas
 * Data: 2023
 */

// DOM Elements
const loginButton = document.querySelector('#login-button');
const loginModal = document.querySelector('#login-modal');
const loginForm = document.querySelector('#login-form');
const loginError = document.querySelector('#login-error');
const togglePasswordButton = document.querySelector('#toggle-password');
const passwordInput = document.querySelector('#password');
const mobileMenuToggle = document.querySelector('#mobile-menu-toggle');
const mobileDropdown = document.querySelector('#mobile-dropdown');
const mobileLoginButton = document.querySelector('#mobile-login-button');
const mobileLogoutButton = document.querySelector('#mobile-logout-button');


/**
 * Inicialização
 */
document.addEventListener('DOMContentLoaded', () => {
    // Configurar eventos apenas se os elementos existirem
    setupLoginModal();
    setupPasswordToggle();
    setupMobileMenu();
});

/**
 * Configura os listeners de eventos para o modal de login e formulário
 */
function setupLoginModal() {
    if (loginButton) {
        loginButton.addEventListener('click', () => toggleLoginModal(true));
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

/**
 * Configura os listeners de eventos para alternar a visibilidade da senha
 */
function setupPasswordToggle() {
    if (togglePasswordButton && passwordInput) {
        togglePasswordButton.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePasswordButton.innerHTML = type === 'password' ? 
                '<i class="fas fa-eye"></i>' : 
                '<i class="fas fa-eye-slash"></i>';
        });
    }
}

/**
 * Configura o menu mobile com funcionalidades de dropdown
 */
function setupMobileMenu() {
    // Toggle menu mobile
    if (mobileMenuToggle && mobileDropdown) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileDropdown.classList.toggle('active');
        });
        
        // Fechar menu ao clicar fora
        document.addEventListener('click', function(event) {
            if (!mobileMenuToggle.contains(event.target) && 
                !mobileDropdown.contains(event.target)) {
                mobileDropdown.classList.remove('active');
            }
        });
    }
    
    // Login via menu mobile
    if (mobileLoginButton) {
        mobileLoginButton.addEventListener('click', () => {
            // Fechar dropdown mobile
            if (mobileDropdown) {
                mobileDropdown.classList.remove('active');
            }
            // Abrir modal de login
            toggleLoginModal(true);
        });
    }
    
    // Logout via menu mobile
    if (mobileLogoutButton) {
        mobileLogoutButton.addEventListener('click', () => {
            // Fechar dropdown mobile
            if (mobileDropdown) {
                mobileDropdown.classList.remove('active');
            }
            // Executar logout
            handleLogout();
        });
    }
}

/**
 * Manipula o envio do formulário de login
 * @param {Event} event - Evento de submit
 */
async function handleLogin(event) {
    event.preventDefault();
    const password = passwordInput.value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (data.success) {
            window.location.reload();
        } else {
            loginError.textContent = data.message || 'Senha incorreta. Tente novamente.';
            loginError.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro no login:', error);
        loginError.textContent = 'Erro ao tentar fazer login. Tente novamente.';
        loginError.style.display = 'block';
    }
}

/**
 * Manipula o logout
 */
async function handleLogout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });

        if (response.ok) {
            window.location.reload();
        } else {
            // Handle non-ok response (e.g., show error message)
            console.error("Logout failed:", response.status, response.statusText);
        }
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}

/**
 * Exibe/oculta o modal de login
 * @param {boolean} show - Se deve mostrar ou esconder o modal
 */
function toggleLoginModal(show) {
    if (loginModal) {
        loginModal.style.display = show ? 'block' : 'none';
    }
}