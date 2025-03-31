/**
 * Utilitários compartilhados - Futsal de Domingo
 * Funções utilitárias usadas em múltiplos scripts
 * 
 * Autor: Raphael Nugas
 * Data: 2023
 */

/**
 * Formata uma data no formato ISO para exibição
 * @param {string} isoDate - Data no formato ISO
 * @param {boolean} showTime - Se deve mostrar o horário
 * @returns {string} Data formatada
 */
function formatDate(isoDate, showTime = false) {
    if (!isoDate) return "";
    
    const date = new Date(isoDate);
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
    };
    
    if (showTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('pt-BR', options);
}

/**
 * Formata o tempo de cronômetro
 * @param {number} seconds - Total de segundos
 * @returns {string} Tempo formatado MM:SS
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

/**
 * Mostra um overlay de carregamento
 * @param {boolean} show - Se deve mostrar ou esconder
 */
function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Exibe uma mensagem de erro
 * @param {string} message - Mensagem de erro
 */
function showError(message) {
    // Implementação simples usando alert
    alert(`Erro: ${message}`);
}

/**
 * Exibe uma mensagem de sucesso temporária
 * @param {string} message - Mensagem de sucesso
 */
function showSuccess(message) {
    // Criar elemento de alerta
    const alertElement = document.createElement('div');
    alertElement.className = 'alert alert-success';
    alertElement.style.position = 'fixed';
    alertElement.style.top = '20px';
    alertElement.style.left = '50%';
    alertElement.style.transform = 'translateX(-50%)';
    alertElement.style.zIndex = '9999';
    alertElement.style.padding = '10px 20px';
    alertElement.style.borderRadius = '4px';
    alertElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    alertElement.textContent = message;
    
    // Adicionar ao corpo do documento
    document.body.appendChild(alertElement);
    
    // Remover após 3 segundos
    setTimeout(() => {
        alertElement.style.opacity = '0';
        alertElement.style.transition = 'opacity 0.5s';
        
        setTimeout(() => {
            alertElement.remove();
        }, 500);
    }, 3000);
}

/**
 * Exibe ou oculta um modal usando Bootstrap Modal
 * @param {string} modalId - ID do modal a ser exibido/ocultado
 * @param {boolean} show - Se true, exibe o modal; se false, oculta
 */
function toggleModal(modalId, show) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
        console.error(`Modal com ID ${modalId} não encontrado`);
        return;
    }
    
    try {
        if (show) {
            // Instanciar o modal com opções padrão
            const bsModal = new bootstrap.Modal(modalElement, {
                backdrop: true,
                keyboard: true
            });
            
            // Corrigir problemas de foco quando o modal for mostrado
            modalElement.addEventListener('shown.bs.modal', function() {
                // Focar no primeiro campo de entrada, se houver
                const firstInput = modalElement.querySelector('input, textarea, button:not(.btn-close)');
                if (firstInput) {
                    firstInput.focus();
                }
            }, { once: true });
            
            bsModal.show();
        } else {
            const bsModal = bootstrap.Modal.getInstance(modalElement);
            if (bsModal) {
                // Remover foco de qualquer elemento dentro do modal antes de fechar
                if (document.activeElement) {
                    document.activeElement.blur();
                }
                bsModal.hide();
            }
        }
    } catch (error) {
        console.error(`Erro ao manipular o modal ${modalId}:`, error);
    }
}

/**
 * Gera um número aleatório entre min e max (inclusive)
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} Número aleatório
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Embaralha um array
 * @param {Array} array - Array a ser embaralhado
 * @returns {Array} Novo array embaralhado
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Obtém as iniciais de um nome
 * @param {string} name - Nome completo
 * @returns {string} Iniciais
 */
function getInitials(name) {
    if (!name) return '?';
    
    const nameParts = name.split(' ');
    if (nameParts.length === 1) {
        return nameParts[0].substring(0, 2).toUpperCase();
    } else {
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
}

/**
 * Toca um som de alarme
 */
function playAlarm() {
    // Usar Web Audio API para criar um som de alarme
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Criar oscilador
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.5;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Tocar por 1 segundo
        oscillator.start();
        
        // Parar após 1 segundo
        setTimeout(() => {
            oscillator.stop();
        }, 1000);
        
        // Vibrar dispositivo móvel, se suportado
        if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500]);
        }
    } catch (error) {
        console.error('Erro ao tocar alarme:', error);
    }
}

/**
 * Retorna uma cor para o texto com base no valor de fundo
 * @param {string} color - Cor de fundo (ex: 'orange', 'black')
 * @returns {string} Cor para o texto
 */
function getTextColorForBackground(color) {
    return color === 'black' ? 'white' : 'black';
}

/**
 * Adiciona evento para fechar um modal ao clicar fora (não necessário com Bootstrap Modal)
 * Esta função agora é apenas um wrapper mantido para compatibilidade
 * @param {string} modalId - ID do modal
 */
function setupModalOutsideClick(modalId) {
    // Bootstrap Modal já tem esse comportamento por padrão
    // Mantido apenas para compatibilidade com código existente
    console.info(`setupModalOutsideClick não é mais necessário para o modal ${modalId}`);
}

/**
 * Formata um evento para exibição nos logs
 * @param {string} eventType - Tipo do evento
 * @returns {string} Texto formatado do tipo de evento
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

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Corrija o problema de foco em modais
    document.querySelectorAll('.modal').forEach(modalElement => {
        modalElement.addEventListener('shown.bs.modal', function() {
            // Focar no primeiro campo de entrada, se existir
            const firstInput = this.querySelector('input:not([type="hidden"]), select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        });
        
        modalElement.addEventListener('hide.bs.modal', function() {
            // Remover o foco de qualquer elemento antes de esconder o modal
            if (document.activeElement) {
                document.activeElement.blur();
            }
        });
    });
});
