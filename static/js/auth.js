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
const closeModalButton = document.querySelector('#close-modal');
const logoutButton = document.querySelector('#logout-button');


/**
 * Inicialização
 */
document.addEventListener('DOMContentLoaded', () => {
    // Configurar eventos apenas se os elementos existirem
    setupLoginModal();
    setupPasswordToggle();
    setupMobileMenu();
    setupLogout();
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
    
    if (closeModalButton) {
        closeModalButton.addEventListener('click', () => toggleLoginModal(false));
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

    // Limpar erro anterior
    loginError.style.display = 'none';
    
    if (!password || password.trim() === '') {
        loginError.textContent = 'Por favor, digite a senha.';
        loginError.style.display = 'block';
        return;
    }

    try {
        // Mostrar indicador de carregamento, se disponível
        if (window.showLoading) {
            window.showLoading(true);
        }
        
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
            // Limpar o campo de senha
            passwordInput.value = '';
            passwordInput.focus();
        }
    } catch (error) {
        console.error('Erro no login:', error);
        loginError.textContent = 'Erro ao tentar fazer login. Verifique sua conexão e tente novamente.';
        loginError.style.display = 'block';
    } finally {
        // Esconder indicador de carregamento, se disponível
        if (window.showLoading) {
            window.showLoading(false);
        }
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
    try {
        const loginModalElement = document.getElementById('login-modal');
        
        if (show) {
            // Limpar campo de senha e erro ao abrir o modal
            if (passwordInput) {
                passwordInput.value = '';
            }
            if (loginError) {
                loginError.style.display = 'none';
            }
            
            // Instanciar o modal do Bootstrap
            const bsModal = new bootstrap.Modal(loginModalElement, {
                backdrop: 'static',  // Impede fechamento ao clicar fora
                keyboard: true       // Permite fechar com ESC
            });
            
            // Corrigir os problemas de foco antes de mostrar
            loginModalElement.addEventListener('shown.bs.modal', function () {
                // Definir o foco no campo de senha
                if (passwordInput) {
                    passwordInput.focus();
                }
            }, { once: true });
            
            bsModal.show();
        } else {
            const bsModal = bootstrap.Modal.getInstance(loginModalElement);
            if (bsModal) {
                // Remover foco de qualquer elemento dentro do modal antes de fechar
                document.activeElement.blur();
                bsModal.hide();
            }
        }
    } catch (error) {
        console.error('Erro ao manipular o modal de login:', error);
    }
}

/**
 * Configura os eventos de logout
 */
function setupLogout() {
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}