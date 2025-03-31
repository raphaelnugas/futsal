/**
 * Gerenciamento de Jogadores - Futsal de Domingo
 * Script responsável pelo CRUD de jogadores
 * 
 * Autor: Raphael Nugas
 * Data: 2023
 */

// Elementos do DOM que serão manipulados
const playerListElement = document.getElementById('player-list');
const addPlayerForm = document.getElementById('add-player-form');
const editPlayerForm = document.getElementById('edit-player-form');
const addPlayerModal = document.getElementById('add-player-modal');
const editPlayerModal = document.getElementById('edit-player-modal');
const closeAddModalButton = document.getElementById('close-add-modal');
const closeEditModalButton = document.getElementById('close-edit-modal');
const addPlayerButton = document.getElementById('add-player-button');
const searchPlayerInput = document.getElementById('search-player');
const loadingElement = document.getElementById('loading');

// Elementos do editor de avatar - Adicionar
const addAvatarContainer = document.getElementById('add-avatar-container');
const addAvatarCircle = document.getElementById('add-avatar-circle');
const addAvatarEditor = document.getElementById('add-avatar-editor');
const addAvatarInput = document.getElementById('add-avatar-input');
const addAvatarData = document.getElementById('add-avatar-data');
const addAvatarControls = document.getElementById('add-avatar-controls');
const addAvatarConfirm = document.getElementById('add-avatar-confirm');
const addZoomIn = document.getElementById('add-zoom-in');
const addZoomOut = document.getElementById('add-zoom-out');
const addRotate = document.getElementById('add-rotate');
const addReset = document.getElementById('add-reset');

// Elementos do editor de avatar - Editar
const editAvatarContainer = document.getElementById('edit-avatar-container');
const editAvatarCircle = document.getElementById('edit-avatar-circle');
const editAvatarEditor = document.getElementById('edit-avatar-editor');
const editAvatarInput = document.getElementById('edit-avatar-input');
const editAvatarData = document.getElementById('edit-avatar-data');
const editAvatarControls = document.getElementById('edit-avatar-controls');
const editAvatarConfirm = document.getElementById('edit-avatar-confirm');
const editZoomIn = document.getElementById('edit-zoom-in');
const editZoomOut = document.getElementById('edit-zoom-out');
const editRotate = document.getElementById('edit-rotate');
const editReset = document.getElementById('edit-reset');

// Estado da aplicação
let players = [];
let currentEditingPlayer = null;
let addAvatarCropper = null;
let editAvatarCropper = null;

/**
 * Inicialização da página de jogadores
 */
document.addEventListener('DOMContentLoaded', () => {
    // Carregar jogadores da API
    loadPlayers();

    // Configurar listeners de eventos
    setupEventListeners();
});

/**
 * Configuração dos listeners de eventos
 */
function setupEventListeners() {
    // Evento para abrir o modal de adicionar jogador
    if (addPlayerButton) {
        addPlayerButton.addEventListener('click', () => {
            toggleAddModal(true);
        });
    }

    // Eventos para fechar modais
    if (closeAddModalButton) {
        closeAddModalButton.addEventListener('click', () => {
            toggleAddModal(false);
        });
    }

    if (closeEditModalButton) {
        closeEditModalButton.addEventListener('click', () => {
            toggleEditModal(false);
        });
    }

    // Eventos para formulários
    if (addPlayerForm) {
        addPlayerForm.addEventListener('submit', handleAddPlayer);
    }

    if (editPlayerForm) {
        editPlayerForm.addEventListener('submit', handleEditPlayer);
    }

    // Evento para input de busca
    if (searchPlayerInput) {
        searchPlayerInput.addEventListener('input', filterPlayers);
    }

    // Configurar eventos de avatar
    setupAvatarEvents();

    // Limpar estado ao fechar modais
    $(addPlayerModal).on('hidden.bs.modal', function () {
        resetAddAvatarEditor();
        resetAddPlayerForm();
    });

    $(editPlayerModal).on('hidden.bs.modal', function () {
        resetEditAvatarEditor();
        resetEditPlayerForm();
    });
}

/**
 * Configura os eventos relacionados ao upload e edição de avatar
 */
function setupAvatarEvents() {
    // Adicionar Jogador - Avatar
    if (addAvatarCircle) {
        addAvatarCircle.onclick = function() {
            addAvatarInput.click();
        };
    }
    
    if (addAvatarInput) {
        addAvatarInput.addEventListener('change', function(e) {
            handleAvatarUpload(e, 'add');
        });
    }
    
    if (addAvatarConfirm) {
        addAvatarConfirm.addEventListener('click', function() {
            finishAvatarEdit('add');
        });
    }
    
    // Botões de controle - Adicionar
    if (addZoomIn) {
        addZoomIn.addEventListener('click', function(e) {
            e.preventDefault();
            if (addAvatarCropper) addAvatarCropper.zoom(0.1);
        });
    }
    
    if (addZoomOut) {
        addZoomOut.addEventListener('click', function(e) {
            e.preventDefault();
            if (addAvatarCropper) addAvatarCropper.zoom(-0.1);
        });
    }
    
    if (addRotate) {
        addRotate.addEventListener('click', function(e) {
            e.preventDefault();
            if (addAvatarCropper) addAvatarCropper.rotate(90);
        });
    }
    
    if (addReset) {
        addReset.addEventListener('click', function(e) {
            e.preventDefault();
            if (addAvatarCropper) addAvatarCropper.reset();
        });
    }
    
    // Editar Jogador - Avatar
    if (editAvatarCircle) {
        editAvatarCircle.onclick = function() {
            editAvatarInput.click();
        };
    }
    
    if (editAvatarInput) {
        editAvatarInput.addEventListener('change', function(e) {
            handleAvatarUpload(e, 'edit');
        });
    }
    
    if (editAvatarConfirm) {
        editAvatarConfirm.addEventListener('click', function() {
            finishAvatarEdit('edit');
        });
    }
    
    // Botões de controle - Editar
    if (editZoomIn) {
        editZoomIn.addEventListener('click', function(e) {
            e.preventDefault();
            if (editAvatarCropper) editAvatarCropper.zoom(0.1);
        });
    }
    
    if (editZoomOut) {
        editZoomOut.addEventListener('click', function(e) {
            e.preventDefault();
            if (editAvatarCropper) editAvatarCropper.zoom(-0.1);
        });
    }
    
    if (editRotate) {
        editRotate.addEventListener('click', function(e) {
            e.preventDefault();
            if (editAvatarCropper) editAvatarCropper.rotate(90);
        });
    }
    
    if (editReset) {
        editReset.addEventListener('click', function(e) {
            e.preventDefault();
            if (editAvatarCropper) editAvatarCropper.reset();
        });
    }
}

/**
 * Manipula o upload de avatar
 * @param {Event} event - Evento do upload
 * @param {string} mode - Modo: 'add' ou 'edit'
 */
function handleAvatarUpload(event, mode) {
    const file = event.target.files[0];
    if (!file) return;
    
    const container = mode === 'add' ? addAvatarContainer : editAvatarContainer;
    const editor = mode === 'add' ? addAvatarEditor : editAvatarEditor;
    
    // Limpar cropper existente
    if (mode === 'add' && addAvatarCropper) {
        addAvatarCropper.destroy();
        addAvatarCropper = null;
    } else if (mode === 'edit' && editAvatarCropper) {
        editAvatarCropper.destroy();
        editAvatarCropper = null;
    }
    
    // Ler o arquivo
    const reader = new FileReader();
    reader.onload = function(e) {
        // Entrar no modo de edição
        container.classList.remove('avatar-normal');
        container.classList.add('avatar-editing');
        
        // Criar e inserir a imagem no editor
        editor.innerHTML = `<img src="${e.target.result}" crossorigin="anonymous">`;
        
        // Adicionar guia circular antes de inicializar o cropper
        // isso ajuda a visualizar onde a imagem será recortada
        addCircularGuide(editor);
        
        // Obter dimensões do container para definir tamanho ideal do cropper
        const containerWidth = editor.clientWidth;
        const containerHeight = editor.clientHeight;
        
        // Inicializar o Cropper com configurações melhoradas
        const image = editor.querySelector('img');
        const cropperOptions = {
            aspectRatio: 1, // Manter proporção 1:1 para círculo
            viewMode: 1, // Restringir cropper à imagem
            dragMode: 'move', // Permitir mover a imagem
            guides: false, // Sem guias
            center: true, // Mostrar indicador de centro
            highlight: false, // Sem destaque na área de corte
            background: false, // Sem fundo xadrez
            autoCropArea: 0.9, // Ajustar para 90% da área
            responsive: true,
            restore: false,
            checkCrossOrigin: false,
            checkOrientation: false, // Impedir manipulações automáticas
            modal: true, // Manter modal
            movable: true, // Permitir movimento
            rotatable: true, // Permitir rotação
            scalable: false, // Impedir escalabilidade
            zoomable: true, // Permitir zoom
            zoomOnTouch: true,
            zoomOnWheel: true,
            wheelZoomRatio: 0.05, // Ajuste fino para zoom com roda do mouse
            cropBoxMovable: false, // Impedir mover a área de corte
            cropBoxResizable: false, // Impedir redimensionar a área de corte
            toggleDragModeOnDblclick: false, // Não alternar modo de arrastar no duplo clique
            minContainerWidth: 200,
            minContainerHeight: 200,
            minCanvasWidth: 200,
            minCanvasHeight: 200,
            minCropBoxWidth: 150,
            minCropBoxHeight: 150,
            ready: function(event) {
                // Quando o cropper estiver pronto
                const cropper = this.cropper;
                
                // Tamanho fixo para o crop box
                const cropBoxSize = 150;
                
                // Forçar o tamanho e formato do crop box
                const cropBoxData = {
                    width: cropBoxSize,
                    height: cropBoxSize,
                    left: (containerWidth - cropBoxSize) / 2,
                    top: (containerHeight - cropBoxSize) / 2
                };
                
                // Primeiramente, desabilitamos o cropper para evitar eventos
                cropper.disable();
                
                // Aplicamos as configurações fixas
                cropper.setCropBoxData(cropBoxData);
                
                // Reabilitamos para permitir movimentação da imagem
                cropper.enable();
                
                // Remover a guia circular depois que o cropper estiver pronto
                // para evitar elementos visuais duplicados
                const existingGuide = editor.querySelector('.circular-guide');
                if (existingGuide) {
                    existingGuide.remove();
                }
                
                // Adicionar classe para garantir formato circular
                const cropBox = cropper.cropBox;
                if (cropBox) {
                    cropBox.classList.add('circular-cropbox');
                }
            }
        };
        
        // Criar o cropper com as opções definidas
        if (mode === 'add') {
            addAvatarCropper = new Cropper(image, cropperOptions);
        } else {
            editAvatarCropper = new Cropper(image, cropperOptions);
        }
    };
    
    reader.readAsDataURL(file);
}

/**
 * Finaliza a edição do avatar e salva os dados
 * @param {string} mode - Modo: 'add' ou 'edit'
 */
function finishAvatarEdit(mode) {
    const container = mode === 'add' ? addAvatarContainer : editAvatarContainer;
    const circle = mode === 'add' ? addAvatarCircle : editAvatarCircle;
    const dataField = mode === 'add' ? addAvatarData : editAvatarData;
    const cropper = mode === 'add' ? addAvatarCropper : editAvatarCropper;
    const input = mode === 'add' ? addAvatarInput : editAvatarInput;
    
    if (!cropper) return;
    
    try {
        // Obter a imagem recortada com alta qualidade
        const canvas = cropper.getCroppedCanvas({
            width: 400, // Usar uma resolução maior para evitar desfoque
            height: 400,
            minWidth: 400,
            minHeight: 400,
            maxWidth: 800, // Limite máximo para não sobrecarregar
            maxHeight: 800,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
            fillColor: '#fff'
        });
        
        if (!canvas) {
            throw new Error('Não foi possível gerar a imagem recortada');
        }
        
        // Converter para data URL com qualidade máxima
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        
        // Atualizar o campo oculto
        if (dataField) dataField.value = dataUrl;
        
        // Atualizar o avatar com a nova imagem
        circle.innerHTML = `<img src="${dataUrl}" alt="Avatar">`;
        
        // Garantir que a imagem tenha boa qualidade e aparência
        const img = circle.querySelector('img');
        if (img) {
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '50%';
        }
        
        // Voltar ao modo normal
        container.classList.remove('avatar-editing');
        container.classList.add('avatar-normal');
        
        // Destruir o cropper
        cropper.destroy();
        if (mode === 'add') {
            addAvatarCropper = null;
        } else {
            editAvatarCropper = null;
        }
        
        // IMPORTANTE: Limpar o valor do input file para garantir que o evento change 
        // dispare novamente mesmo se o mesmo arquivo for selecionado
        input.value = '';
        
        // Restaurar a funcionalidade de clique para o avatar
        circle.onclick = function() {
            input.click();
        };
    } catch (error) {
        console.error('Erro ao processar imagem:', error);
        showError('Erro ao processar a imagem. Tente novamente.');
        
        // Garantir limpeza mesmo em caso de erro
        if (cropper) {
            try {
                cropper.destroy();
            } catch (e) {
                console.error('Erro ao destruir cropper:', e);
            }
        }
        
        // Limpar referências e input
        if (mode === 'add') {
            addAvatarCropper = null;
        } else {
            editAvatarCropper = null;
        }
        
        // Limpar o valor do input mesmo em caso de erro
        input.value = '';
    }
}

/**
 * Limpa o editor de avatar - Adicionar
 */
function resetAddAvatarEditor() {
    // Destruir cropper se existir
    if (addAvatarCropper) {
        try {
            addAvatarCropper.destroy();
        } catch (e) {
            console.error('Erro ao destruir cropper:', e);
        }
        addAvatarCropper = null;
    }
    
    // Restaurar classe normal
    if (addAvatarContainer) {
        addAvatarContainer.classList.remove('avatar-editing');
        addAvatarContainer.classList.add('avatar-normal');
    }
    
    // Limpar avatar
    if (addAvatarCircle) {
        // Resetar para mostrar iniciais genéricas
        addAvatarCircle.innerHTML = '<div class="avatar-initials">JD</div>';
        
        // Garantir que o evento de clique esteja funcionando
        addAvatarCircle.onclick = function() {
            addAvatarInput.click();
        };
    }
    
    // Limpar editor
    if (addAvatarEditor) {
        addAvatarEditor.innerHTML = '';
    }
    
    // Limpar dados
    if (addAvatarData) {
        addAvatarData.value = '';
    }
    
    // Limpar input file - CRUCIAL para permitir selecionar o mesmo arquivo novamente
    if (addAvatarInput) {
        addAvatarInput.value = '';
    }
}

/**
 * Limpa o editor de avatar - Editar
 */
function resetEditAvatarEditor() {
    // Destruir cropper se existir
    if (editAvatarCropper) {
        try {
            editAvatarCropper.destroy();
        } catch (e) {
            console.error('Erro ao destruir cropper:', e);
        }
        editAvatarCropper = null;
    }
    
    // Restaurar classe normal
    if (editAvatarContainer) {
        editAvatarContainer.classList.remove('avatar-editing');
        editAvatarContainer.classList.add('avatar-normal');
    }
    
    // Limpar avatar ou definir iniciais
    if (editAvatarCircle) {
        // Resetar para mostrar iniciais genéricas
        editAvatarCircle.innerHTML = '<div class="avatar-initials">JD</div>';
        
        // Garantir que o evento de clique esteja funcionando
        editAvatarCircle.onclick = function() {
            editAvatarInput.click();
        };
    }
    
    // Limpar editor
    if (editAvatarEditor) {
        editAvatarEditor.innerHTML = '';
    }
    
    // Limpar dados
    if (editAvatarData) {
        editAvatarData.value = '';
    }
    
    // Limpar input file - CRUCIAL para permitir selecionar o mesmo arquivo novamente
    if (editAvatarInput) {
        editAvatarInput.value = '';
    }
}

/**
 * Limpa o formulário de adicionar jogador
 */
function resetAddPlayerForm() {
    if (addPlayerForm) {
        addPlayerForm.reset();
    }
}

/**
 * Limpa o formulário de editar jogador
 */
function resetEditPlayerForm() {
    if (editPlayerForm) {
        editPlayerForm.reset();
    }
    
    // Limpar jogador atual
    currentEditingPlayer = null;
}

/**
 * Manipula o envio do formulário de adicionar jogador
 */
async function handleAddPlayer(event) {
    event.preventDefault();

    const nameField = document.getElementById('player-name');
    const isGoalkeeperField = document.getElementById('is-goalkeeper');
    const photoDataField = document.getElementById('add-avatar-data');

    // Validar campos
    if (!nameField.value.trim()) {
        showError('O nome do jogador é obrigatório.');
        return;
    }

    // Preparar dados
    const playerData = {
        name: nameField.value.trim(),
        is_goalkeeper: isGoalkeeperField.checked,
        photo_url: photoDataField.value || null
    };

    try {
        showLoading(true);

        // Enviar para a API
        const response = await fetch('/api/players', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(playerData)
        });

        const data = await response.json();

        // Verificar o formato da resposta para lidar com diferentes APIs
        if (data.success && data.player) {
            // Formato mais comum: {success: true, player: {...}}
            players.push(data.player);
            renderPlayerList(players);
            toggleAddModal(false);
            showSuccess('Jogador adicionado com sucesso!');
        } else if (data.id) {
            // A API retornou diretamente o jogador criado
            players.push(data);
            renderPlayerList(players);
            toggleAddModal(false);
            showSuccess('Jogador adicionado com sucesso!');
        } else {
            // Tratar erro
            showError(data.message || data.error || 'Erro ao adicionar jogador.');
        }

        showLoading(false);
    } catch (error) {
        console.error('Erro ao adicionar jogador:', error);
        showError('Erro ao conectar com o servidor. Tente novamente.');
        showLoading(false);
    }
}

/**
 * Manipula o envio do formulário de editar jogador
 */
async function handleEditPlayer(event) {
    event.preventDefault();

    if (!currentEditingPlayer) {
        showError('Erro ao editar jogador: nenhum jogador selecionado.');
        return;
    }

    const nameField = document.getElementById('edit-player-name');
    const isGoalkeeperField = document.getElementById('edit-is-goalkeeper');
    const photoDataField = document.getElementById('edit-avatar-data');

    // Validar campos
    if (!nameField.value.trim()) {
        showError('O nome do jogador é obrigatório.');
        return;
    }

    // Preparar dados
    const playerData = {
        name: nameField.value.trim(),
        is_goalkeeper: isGoalkeeperField.checked,
        photo_url: photoDataField.value || currentEditingPlayer.photo_url || null
    };

    try {
        showLoading(true);

        // Enviar para a API
        const response = await fetch(`/api/players/${currentEditingPlayer.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(playerData)
        });

        const data = await response.json();

        // Verificar o formato da resposta para lidar com diferentes APIs
        if (data.success && data.player) {
            // Formato comum: {success: true, player: {...}}
            updatePlayerInList(data.player);
            toggleEditModal(false);
            showSuccess('Jogador atualizado com sucesso!');
        } else if (data.id) {
            // A API retornou diretamente o jogador atualizado
            updatePlayerInList(data);
            toggleEditModal(false);
            showSuccess('Jogador atualizado com sucesso!');
        } else {
            // Tratar erro
            showError(data.message || data.error || 'Erro ao atualizar jogador.');
        }

        showLoading(false);
    } catch (error) {
        console.error('Erro ao atualizar jogador:', error);
        showError('Erro ao conectar com o servidor. Tente novamente.');
        showLoading(false);
    }
}

/**
 * Atualiza um jogador na lista mantendo a ordem
 */
function updatePlayerInList(updatedPlayer) {
    const index = players.findIndex(p => p.id === updatedPlayer.id);
    if (index !== -1) {
        players[index] = updatedPlayer;
    }
    
    // Reordenar e renderizar
    players.sort((a, b) => a.name.localeCompare(b.name));
    renderPlayerList(players);
}

/**
 * Carrega jogadores da API
 */
async function loadPlayers() {
    try {
        showLoading(true);
        
        console.log('Carregando jogadores da API...');
        const response = await fetch('/api/players');
        
        console.log('Resposta da API:', response.status, response.statusText);
        console.log('Headers:', [...response.headers.entries()]);
        
        const data = await response.json();
        console.log('Dados recebidos:', data);
        
        // Verificar a estrutura da resposta e obter a lista de jogadores
        // Algumas APIs retornam diretamente o array, outras usam um objeto com uma propriedade players
        if (Array.isArray(data)) {
            // A API retornou diretamente um array de jogadores
            console.log('Formato: Array de jogadores');
            players = data;
        } else if (data.success && data.players) {
            // A API retornou um objeto com success e players
            console.log('Formato: Objeto com success e players');
            players = data.players;
        } else if (data.players) {
            // A API retornou um objeto com players, mas sem success
            console.log('Formato: Objeto com players');
            players = data.players;
        } else {
            // Outro formato, possivelmente erro
            console.error('Formato de resposta inesperado:', data);
            showError('Erro ao carregar jogadores: formato de resposta inválido.');
            players = [];
        }
        
        console.log('Jogadores processados:', players.length);
        
        // Ordenar jogadores por nome para melhor visualização
        players.sort((a, b) => a.name.localeCompare(b.name));
        
        // Atualizar a interface
        renderPlayerList(players);
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar jogadores:', error);
        showError('Erro ao conectar com o servidor. Tente novamente.');
        showLoading(false);
    }
}

/**
 * Renderiza a lista de jogadores na interface
 */
function renderPlayerList(players) {
    console.log('Renderizando lista de jogadores:', players?.length || 0);
    
    if (!playerListElement) {
        console.error('Elemento playerListElement não encontrado!');
        return;
    }

    // Limpar a lista atual
    playerListElement.innerHTML = '';

    if (!players || players.length === 0) {
        console.log('Nenhum jogador para mostrar');
        playerListElement.innerHTML = '<div class="alert alert-info">Nenhum jogador encontrado.</div>';
        return;
    }

    console.log('Criando cards para', players.length, 'jogadores');
    players.forEach((player, index) => {
        if (!player || !player.id) {
            console.warn(`Jogador inválido no índice ${index}:`, player);
            return;
        }
        
        try {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';

            // Criar o elemento de foto com iniciais ou imagem
            const photoHTML = player.photo_url 
                ? `<img src="${player.photo_url}" alt="${player.name}">`
                : `<div class="avatar-initials">${getPlayerInitials(player.name)}</div>`;

            playerCard.innerHTML = `
                <div class="player-photo">
                    ${photoHTML}
                </div>
                <div class="player-name">${player.name}</div>
                <div class="player-role">${player.is_goalkeeper ? 'Goleiro' : 'Jogador de linha'}</div>
                <div class="player-actions">
                    <button class="btn btn-sm btn-secondary edit-player" data-id="${player.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-player" data-id="${player.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            // Adicionar eventos para os botões
            const editButton = playerCard.querySelector('.edit-player');
            const deleteButton = playerCard.querySelector('.delete-player');

            if (editButton) {
                editButton.addEventListener('click', () => {
                    openEditModal(player);
                });
            }

            if (deleteButton) {
                deleteButton.addEventListener('click', () => {
                    confirmDeletePlayer(player);
                });
            }

            playerListElement.appendChild(playerCard);
        } catch (error) {
            console.error(`Erro ao renderizar jogador ${player?.name || index}:`, error);
        }
    });
    
    console.log('Renderização concluída');
}

/**
 * Obtém as iniciais do nome do jogador para exibir no avatar
 */
function getPlayerInitials(name) {
    if (!name) return '?';

    const nameParts = name.split(' ');
    if (nameParts.length === 1) {
        return nameParts[0].substring(0, 2).toUpperCase();
    } else {
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
}

/**
 * Filtra a lista de jogadores com base no texto de busca
 */
function filterPlayers() {
    if (!searchPlayerInput || !players) return;
    
    const searchTerm = searchPlayerInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        // Se o termo de busca estiver vazio, mostrar todos os jogadores
        renderPlayerList(players);
        return;
    }
    
    // Filtrar jogadores que contêm o termo de busca no nome
    const filteredPlayers = players.filter(player => 
        player.name.toLowerCase().includes(searchTerm)
    );
    
    // Renderizar a lista filtrada
    renderPlayerList(filteredPlayers);
}

/**
 * Exibe/oculta o modal de adicionar jogador
 */
function toggleAddModal(show) {
    if (!addPlayerModal) return;

    // Utilizar a função compartilhada toggleModal
    toggleModal('add-player-modal', show);

    if (show) {
        // Resetar formulário
        resetAddPlayerForm();
        resetAddAvatarEditor();
        
        // Atualizar as iniciais com base em "JD" (jogador demo)
        if (addAvatarCircle) {
            addAvatarCircle.innerHTML = '<div class="avatar-initials">JD</div>';
        }
        
        // Focar no campo de nome
        setTimeout(() => {
            document.getElementById('player-name').focus();
        }, 100);
    }
}

/**
 * Exibe/oculta o modal de editar jogador
 */
function toggleEditModal(show) {
    if (!editPlayerModal) return;

    // Utilizar a função compartilhada toggleModal
    toggleModal('edit-player-modal', show);

    if (!show) {
        currentEditingPlayer = null;
    }
}

/**
 * Exibe um diálogo de confirmação para excluir jogador
 */
function confirmDeletePlayer(player) {
    if (!player) return;
    
    // Confirmar exclusão
    if (confirm(`Tem certeza que deseja excluir o jogador ${player.name}?`)) {
        handleDeletePlayer(player.id);
    }
}

/**
 * Processa a exclusão de um jogador
 */
async function handleDeletePlayer(playerId) {
    if (!playerId) return;
    
    try {
        showLoading(true);
        
        // Enviar para a API
        const response = await fetch(`/api/players/${playerId}`, {
            method: 'DELETE'
        });
        
        // Verificar se a API retornou uma resposta JSON
        let success = response.ok;
        let message = '';
        
        try {
            // Tentar parsear o JSON, mas pode falhar se a resposta não for JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                
                // Algumas APIs usam um campo "success"
                if (typeof data.success === 'boolean') {
                    success = data.success;
                }
                
                // Capturar mensagem de erro, se houver
                message = data.message || data.error || '';
            }
        } catch (jsonError) {
            // Se ocorrer erro no parse, mantemos o valor de "success" baseado em response.ok
            console.warn("Resposta não é JSON ou ocorreu erro no parse:", jsonError);
        }
        
        if (success) {
            // Remover jogador da lista
            players = players.filter(p => p.id !== playerId);
            
            // Atualizar a interface
            renderPlayerList(players);
            
            // Mostrar mensagem de sucesso
            showSuccess('Jogador excluído com sucesso!');
        } else {
            // Exibir mensagem de erro
            showError(message || 'Erro ao excluir jogador.');
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao excluir jogador:', error);
        showError('Erro ao conectar com o servidor. Tente novamente.');
        showLoading(false);
    }
}

/**
 * Exibe uma mensagem de sucesso
 */
function showSuccess(message) {
    const alertElement = document.createElement('div');
    alertElement.className = 'alert alert-success';
    alertElement.innerHTML = message;
    
    document.body.appendChild(alertElement);
    
    // Auto-remover após 3 segundos
    setTimeout(() => {
        alertElement.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(alertElement);
        }, 300);
    }, 3000);
}

/**
 * Exibe uma mensagem de erro
 */
function showError(message) {
    const alertElement = document.createElement('div');
    alertElement.className = 'alert alert-danger';
    alertElement.innerHTML = message;
    
    document.body.appendChild(alertElement);
    
    // Auto-remover após 3 segundos
    setTimeout(() => {
        alertElement.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(alertElement);
        }, 300);
    }, 3000);
}

/**
 * Exibe/oculta o indicador de carregamento
 */
function showLoading(show) {
    if (!loadingElement) return;
    
    loadingElement.style.display = show ? 'flex' : 'none';
}

/**
 * Abre o modal de edição com os dados do jogador
 */
function openEditModal(player) {
    // Limpar o estado anterior
    resetEditAvatarEditor();
    resetEditPlayerForm();
    
    // Definir o jogador atual sendo editado
    currentEditingPlayer = player;

    if (!editPlayerForm) return;

    // Preencher o formulário com os dados do jogador
    const nameField = editPlayerForm.querySelector('#edit-player-name');
    const isGoalkeeperField = editPlayerForm.querySelector('#edit-is-goalkeeper');

    if (nameField) nameField.value = player.name;
    if (isGoalkeeperField) isGoalkeeperField.checked = player.is_goalkeeper;

    // Atualizar o avatar
    if (editAvatarCircle) {
        if (player.photo_url) {
            // Se tiver foto, exibir no avatar
            editAvatarCircle.innerHTML = `<img src="${player.photo_url}" alt="${player.name}">`;
        } else {
            // Se não tiver, mostrar iniciais
            const initials = getPlayerInitials(player.name);
            editAvatarCircle.innerHTML = `<div class="avatar-initials">${initials}</div>`;
        }
    }

    // Exibir o modal
    toggleEditModal(true);
}

/**
 * Abre/fecha um modal usando a API do Bootstrap
 * @param {string} modalId - ID do modal
 * @param {boolean} show - true para abrir, false para fechar
 */
function toggleModal(modalId, show) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;
    
    if (window.bootstrap) {
        // Usar a API do Bootstrap 5
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        
        if (show) {
            if (!modalInstance) {
                new bootstrap.Modal(modalElement).show();
            } else {
                modalInstance.show();
            }
        } else {
            if (modalInstance) {
                modalInstance.hide();
            }
        }
    } else {
        // Fallback para uso do jQuery (Bootstrap 4)
        try {
            if (show) {
                $(modalElement).modal('show');
            } else {
                $(modalElement).modal('hide');
            }
        } catch (error) {
            console.error('Erro ao manipular modal:', error);
        }
    }
}

/**
 * Adiciona uma guia circular ao editor de avatar
 * @param {HTMLElement} editorContainer - Contêiner do editor
 * @param {number} size - Tamanho da guia em pixels
 */
function addCircularGuide(editorContainer, size = 150) {
    // Remover qualquer guia existente
    const existingGuide = editorContainer.querySelector('.circular-guide');
    if (existingGuide) {
        existingGuide.remove();
    }
    
    // Criar elemento de guia
    const guide = document.createElement('div');
    guide.className = 'circular-guide';
    guide.style.width = `${size}px`;
    guide.style.height = `${size}px`;
    
    // Posicionar no centro do editor
    const editorRect = editorContainer.getBoundingClientRect();
    guide.style.left = `${(editorRect.width - size) / 2}px`;
    guide.style.top = `${(editorRect.height - size) / 2}px`;
    
    // Adicionar ao editor
    editorContainer.appendChild(guide);
    
    // Retornar para possível uso posterior
    return guide;
}