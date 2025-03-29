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
const playerPhotoInput = document.getElementById('player-photo');
const photoPreview = document.getElementById('photo-preview');
const photoEditorControls = document.getElementById('photo-editor-controls');
const editPlayerPhotoInput = document.getElementById('edit-player-photo');
const editPhotoPreview = document.getElementById('edit-photo-preview');
const editPhotoEditorControls = document.getElementById('edit-photo-editor-controls');

// Estado da aplicação
let players = [];
let currentEditingPlayer = null;
let currentPhotoState = {
    zoom: 1,
    rotation: 0,
    photoData: null,
    offsetX: 0,
    offsetY: 0
};
let currentEditPhotoState = {
    zoom: 1,
    rotation: 0,
    photoData: null,
    offsetX: 0,
    offsetY: 0
};

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

    // Eventos para upload de foto e manipulação de imagem
    if (playerPhotoInput) {
        playerPhotoInput.addEventListener('change', handlePhotoUpload);
    }

    if (editPlayerPhotoInput) {
        editPlayerPhotoInput.addEventListener('change', handleEditPhotoUpload);
    }

    // Eventos de clique nos círculos de foto para abrir o seletor de arquivo
    if (photoPreview) {
        photoPreview.addEventListener('click', () => {
            playerPhotoInput.click();
        });
    }

    if (editPhotoPreview) {
        editPhotoPreview.addEventListener('click', () => {
            editPlayerPhotoInput.click();
        });
    }

    // Eventos para controles de edição de foto
    setupPhotoEditorControls();

    // Os modais Bootstrap fecham automaticamente ao clicar fora
}

/**
 * Configura os controles do editor de fotos
 */
function setupPhotoEditorControls() {
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    // Controles do modo de adicionar
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const rotateCwButton = document.getElementById('rotate-cw');
    const resetPhotoButton = document.getElementById('reset-photo');

    if (zoomInButton) {
        zoomInButton.addEventListener('click', () => {
            currentPhotoState.zoom *= 1.1;
            updatePhotoPreview();
        });
    }

    if (zoomOutButton) {
        zoomOutButton.addEventListener('click', () => {
            currentPhotoState.zoom *= 0.9;
            updatePhotoPreview();
        });
    }

    if (rotateCwButton) {
        rotateCwButton.addEventListener('click', () => {
            currentPhotoState.rotation += 90;
            updatePhotoPreview();
        });
    }

    if (resetPhotoButton) {
        resetPhotoButton.addEventListener('click', () => {
            currentPhotoState.zoom = 1;
            currentPhotoState.rotation = 0;
            currentPhotoState.offsetX = 0;
            currentPhotoState.offsetY = 0;
            updatePhotoPreview();
        });
    }

    // Configurar Cropper.js para manipulação da imagem
    const photoPreviewElement = document.querySelector('.player-photo-preview img');
    if (photoPreviewElement) {
        const cropper = new Cropper(photoPreviewElement, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 1,
            restore: false,
            modal: true,
            guides: false,
            highlight: false,
            cropBoxMovable: false,
            cropBoxResizable: false,
            toggleDragModeOnDblclick: false,
        });
        
        // Atualizar controles de zoom
        if (zoomInButton) {
            zoomInButton.addEventListener('click', () => {
                cropper.zoom(0.1);
            });
        }
        
        if (zoomOutButton) {
            zoomOutButton.addEventListener('click', () => {
                cropper.zoom(-0.1);
            });
        }
        
        if (rotateCwButton) {
            rotateCwButton.addEventListener('click', () => {
                cropper.rotate(90);
            });
        }
        
        if (resetPhotoButton) {
            resetPhotoButton.addEventListener('click', () => {
                cropper.reset();
            });
        }
    }


    // Controles do modo de editar
    const editZoomInButton = document.getElementById('edit-zoom-in');
    const editZoomOutButton = document.getElementById('edit-zoom-out');
    const editRotateCwButton = document.getElementById('edit-rotate-cw');
    const editResetPhotoButton = document.getElementById('edit-reset-photo');

    if (editZoomInButton) {
        editZoomInButton.addEventListener('click', () => {
            currentEditPhotoState.zoom *= 1.1;
            updateEditPhotoPreview();
        });
    }

    if (editZoomOutButton) {
        editZoomOutButton.addEventListener('click', () => {
            currentEditPhotoState.zoom *= 0.9;
            updateEditPhotoPreview();
        });
    }

    if (editRotateCwButton) {
        editRotateCwButton.addEventListener('click', () => {
            currentEditPhotoState.rotation += 90;
            updateEditPhotoPreview();
        });
    }

    if (editResetPhotoButton) {
        editResetPhotoButton.addEventListener('click', () => {
            currentEditPhotoState.zoom = 1;
            currentEditPhotoState.rotation = 0;
            currentEditPhotoState.offsetX = 0;
            currentEditPhotoState.offsetY = 0;
            updateEditPhotoPreview();
        });
    }

    // Adicionar controles de movimentação da imagem
    const editPhotoPreviewElement = document.querySelector('.edit-player-photo-preview img');
    if (editPhotoPreviewElement) {
        editPhotoPreviewElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX - currentEditPhotoState.offsetX;
            startY = e.clientY - currentEditPhotoState.offsetY;
            editPhotoPreviewElement.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            currentEditPhotoState.offsetX = e.clientX - startX;
            currentEditPhotoState.offsetY = e.clientY - startY;
            updateEditPhotoPreview();
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            if (editPhotoPreviewElement) {
                editPhotoPreviewElement.style.cursor = 'grab';
            }
        });
    }
}

/**
 * Manipula o upload de foto no formulário de adicionar
 */
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Resetar o estado da foto
        currentPhotoState = {
            zoom: 1,
            rotation: 0,
            photoData: null,
            offsetX: 0,
            offsetY: 0
        };

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Armazenar os dados da imagem original
                currentPhotoState.photoData = e.target.result;

                // Atualizar a visualização
                updatePhotoPreview();

                // Mostrar controles de edição
                if (photoEditorControls) {
                    photoEditorControls.style.display = 'block';
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        // Esconder controles se nenhum arquivo for selecionado
        if (photoEditorControls) {
            photoEditorControls.style.display = 'none';
        }

        // Limpar visualização
        if (photoPreview) {
            photoPreview.innerHTML = '<div class="photo-placeholder">Foto</div>';
        }
    }
}

/**
 * Manipula o upload de foto no formulário de editar
 */
function handleEditPhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Resetar o estado da foto
        currentEditPhotoState = {
            zoom: 1,
            rotation: 0,
            photoData: null,
            offsetX: 0,
            offsetY: 0
        };

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Armazenar os dados da imagem original
                currentEditPhotoState.photoData = e.target.result;

                // Atualizar a visualização
                updateEditPhotoPreview();

                // Mostrar controles de edição
                if (editPhotoEditorControls) {
                    editPhotoEditorControls.style.display = 'block';
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        // Esconder controles se nenhum arquivo for selecionado
        if (editPhotoEditorControls) {
            editPhotoEditorControls.style.display = 'none';
        }

        // Limpar visualização
        if (editPhotoPreview) {
            editPhotoPreview.innerHTML = '<div class="photo-placeholder">Foto</div>';
        }
    }
}

/**
 * Atualiza a visualização da foto com base no estado atual (escala e rotação)
 */
function updatePhotoPreview() {
    if (!photoPreview || !currentPhotoState.photoData) return;

    // Limpar a visualização atual
    photoPreview.innerHTML = '';

    // Criar a imagem
    const img = document.createElement('img');
    img.src = currentPhotoState.photoData;
    img.style.transform = `rotate(${currentPhotoState.rotation}deg) scale(${currentPhotoState.zoom}) translate(${currentPhotoState.offsetX}px, ${currentPhotoState.offsetY}px)`;
    img.style.cursor = 'grab';
    img.classList.add('player-photo-preview');

    // Adicionar a imagem ao contêiner
    photoPreview.appendChild(img);

    // Atualizar o campo oculto com os dados processados da imagem
    updatePhotoDataField();
}

/**
 * Atualiza a visualização da foto no modo de edição
 */
function updateEditPhotoPreview() {
    if (!editPhotoPreview || !currentEditPhotoState.photoData) return;

    // Limpar a visualização atual
    editPhotoPreview.innerHTML = '';

    // Criar a imagem
    const img = document.createElement('img');
    img.src = currentEditPhotoState.photoData;
    img.style.transform = `rotate(${currentEditPhotoState.rotation}deg) scale(${currentEditPhotoState.zoom}) translate(${currentEditPhotoState.offsetX}px, ${currentEditPhotoState.offsetY}px)`;
    img.style.cursor = 'grab';
    img.classList.add('edit-player-photo-preview');

    // Adicionar a imagem ao contêiner
    editPhotoPreview.appendChild(img);

    // Atualizar o campo oculto com os dados processados da imagem
    updateEditPhotoDataField();
}

/**
 * Atualiza o campo oculto com os dados da imagem processada
 */
function updatePhotoDataField() {
    const photoDataField = document.getElementById('photo-data');
    if (!photoDataField || !currentPhotoState.photoData) return;

    photoDataField.value = JSON.stringify({
        data: currentPhotoState.photoData,
        zoom: currentPhotoState.zoom,
        rotation: currentPhotoState.rotation,
        offsetX: currentPhotoState.offsetX,
        offsetY: currentPhotoState.offsetY
    });
}

/**
 * Atualiza o campo oculto com os dados da imagem processada no modo de edição
 */
function updateEditPhotoDataField() {
    const photoDataField = document.getElementById('edit-photo-data');
    if (!photoDataField || !currentEditPhotoState.photoData) return;

    photoDataField.value = JSON.stringify({
        data: currentEditPhotoState.photoData,
        zoom: currentEditPhotoState.zoom,
        rotation: currentEditPhotoState.rotation,
        offsetX: currentEditPhotoState.offsetX,
        offsetY: currentEditPhotoState.offsetY
    });
}

/**
 * Carrega a lista de jogadores da API
 */
async function loadPlayers() {
    try {
        showLoading(true);

        const response = await fetch('/api/players');
        players = await response.json();

        // Ordenar jogadores por nome
        players.sort((a, b) => a.name.localeCompare(b.name));

        // Renderizar lista
        renderPlayerList(players);

        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar jogadores:', error);
        showError('Não foi possível carregar a lista de jogadores.');
        showLoading(false);
    }
}

/**
 * Renderiza a lista de jogadores
 */
function renderPlayerList(playerList) {
    if (!playerListElement) return;

    playerListElement.innerHTML = '';

    if (playerList.length === 0) {
        playerListElement.innerHTML = `
            <div class="text-center py-3">
                <p class="text-muted">Nenhum jogador cadastrado.</p>
            </div>
        `;
        return;
    }

    playerList.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'card mb-2';
        playerCard.dataset.playerId = player.id;

        // Obter iniciais para exibir no avatar, se não tiver foto
        const initials = getPlayerInitials(player.name);

        playerCard.innerHTML = `
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <div class="player-avatar mr-3">
                        ${player.photo_url 
                            ? `<img src="${player.photo_url}" alt="${player.name}" class="img-fluid">` 
                            : initials
                        }
                    </div>
                    <div class="player-info">
                        <h5 class="card-title mb-1">${player.name}</h5>
                        <p class="card-text">
                            ${player.is_goalkeeper 
                                ? '<span class="badge badge-blue">Goleiro</span>' 
                                : '<span class="badge badge-orange">Jogador</span>'
                            }
                        </p>
                    </div>
                    <div class="ml-auto">
                        <button class="btn btn-sm btn-outline-primary mr-1 edit-player-btn" data-player-id="${player.id}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-player-btn" data-player-id="${player.id}">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;

        playerListElement.appendChild(playerCard);

        // Adicionar eventos aos botões
        const editButton = playerCard.querySelector('.edit-player-btn');
        const deleteButton = playerCard.querySelector('.delete-player-btn');

        editButton.addEventListener('click', () => openEditModal(player));
        deleteButton.addEventListener('click', () => confirmDeletePlayer(player));
    });
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
 * Filtra jogadores com base no texto de busca
 */
function filterPlayers() {
    const searchText = searchPlayerInput.value.toLowerCase();

    if (!searchText) {
        renderPlayerList(players);
        return;
    }

    const filteredPlayers = players.filter(player => 
        player.name.toLowerCase().includes(searchText)
    );

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
        if (addPlayerForm) addPlayerForm.reset();
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
 * Abre o modal de edição com os dados do jogador
 */
function openEditModal(player) {
    currentEditingPlayer = player;

    if (!editPlayerForm) return;

    // Preencher o formulário com os dados do jogador
    const nameField = editPlayerForm.querySelector('#edit-player-name');
    const isGoalkeeperField = editPlayerForm.querySelector('#edit-is-goalkeeper');

    if (nameField) nameField.value = player.name;
    if (isGoalkeeperField) isGoalkeeperField.checked = player.is_goalkeeper;

    // Se o jogador já tiver uma foto, exibi-la na prévia
    if (player.photo_url && editPhotoPreview) {
        editPhotoPreview.innerHTML = `<img src="${player.photo_url}" alt="${player.name}">`;
    } else if (editPhotoPreview) {
        // Se não tiver foto, mostrar espaço para placeholder
        editPhotoPreview.innerHTML = '<div class="photo-placeholder">Foto</div>';
    }

    // Esconder controles de edição de foto até que uma nova foto seja selecionada
    if (editPhotoEditorControls) {
        editPhotoEditorControls.style.display = 'none';
    }

    // Exibir o modal
    toggleEditModal(true);
}

/**
 * Manipula o envio do formulário de adicionar jogador
 */
async function handleAddPlayer(event) {
    event.preventDefault();

    const nameField = document.getElementById('player-name');
    const isGoalkeeperField = document.getElementById('is-goalkeeper');
    const photoDataField = document.getElementById('photo-data');

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

        if (data.success) {
            // Adicionar jogador à lista
            players.push(data.player);
            // Atualizar a lista
            renderPlayerList(players);
            // Fechar o modal
            toggleAddModal(false);
            // Exibir mensagem de sucesso
            showSuccess('Jogador adicionado com sucesso!');
        } else {
            showError(data.message || 'Erro ao adicionar jogador.');
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
    const photoDataField = document.getElementById('edit-photo-data');

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

        if (data.success) {
            // Atualizar o jogador na lista
            const index = players.findIndex(p => p.id === currentEditingPlayer.id);
            if (index !== -1) {
                players[index] = data.player;
            }

            // Atualizar a lista
            renderPlayerList(players);
            // Fechar o modal
            toggleEditModal(false);
            // Exibir mensagem de sucesso
            showSuccess('Jogador atualizado com sucesso!');
        } else {
            showError(data.message || 'Erro ao atualizar jogador.');
        }

        showLoading(false);
    } catch (error) {
        console.error('Erro ao atualizar jogador:', error);
        showError('Erro ao conectar com o servidor. Tente novamente.');
        showLoading(false);
    }
}

/**
 * Confirma e executa a exclusão de um jogador
 */
function confirmDeletePlayer(player) {
    if (confirm(`Tem certeza que deseja excluir o jogador "${player.name}"? Esta ação não pode ser desfeita.`)) {
        deletePlayer(player.id);
    }
}

/**
 * Exclui um jogador via API
 */
async function deletePlayer(playerId) {
    try {
        showLoading(true);

        const response = await fetch(`/api/players/${playerId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            // Remover jogador da lista
            players = players.filter(player => player.id !== playerId);
            // Atualizar a lista
            renderPlayerList(players);
            // Exibir mensagem de sucesso
            showSuccess('Jogador excluído com sucesso!');
        } else {
            showError(data.message || 'Erro ao excluir jogador.');
        }

        showLoading(false);
    } catch (error) {
        console.error('Erro ao excluir jogador:', error);
        showError('Erro ao conectar com o servidor. Tente novamente.');
        showLoading(false);
    }
}

/**
 * Mostra/oculta o indicador de carregamento
 */
function showLoading(show) {
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Exibe mensagem de erro
 */
function showError(message) {
    alert(`Erro: ${message}`);
}

/**
 * Exibe mensagem de sucesso
 */
function showSuccess(message) {
    // Adicionar um elemento de alerta que desaparece após alguns segundos
    const alertElement = document.createElement('div');
    alertElement.className = 'alert alert-success';
    alertElement.textContent = message;

    // Adicionar ao topo da página
    document.body.insertBefore(alertElement, document.body.firstChild);

    // Remover após 3 segundos
    setTimeout(() => {
        alertElement.remove();
    }, 3000);
}