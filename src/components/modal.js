export function showModal(title, content, onSave, onCancel) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) {
        console.error('Modal container not found in the DOM.');
        return;
    }

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'modal-overlay';
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md';

    const modalHeader = document.createElement('div');
    modalHeader.className = 'flex justify-between items-center pb-3';
    const modalTitle = document.createElement('h3');
    modalTitle.className = 'text-lg font-semibold text-gray-900 dark:text-gray-100';
    modalTitle.textContent = title;
    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300';
    closeButton.innerHTML = '&times;'; // A simple 'x' for close
    closeButton.onclick = hideModal;
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);

    const modalBody = document.createElement('div');
    modalBody.className = 'py-4';
    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    } else {
        modalBody.appendChild(content);
    }

    const modalFooter = document.createElement('div');
    modalFooter.className = 'flex justify-end pt-4';

    const cancelButton = document.createElement('button');
    cancelButton.id = 'modal-cancel-btn';
    cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 mr-2';
    cancelButton.textContent = 'Cancelar';
    cancelButton.onclick = () => {
        if (onCancel) onCancel();
        hideModal();
    };

    const saveButton = document.createElement('button');
    saveButton.id = 'modal-save-btn';
    saveButton.className = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
    saveButton.textContent = 'Salvar';
    saveButton.onclick = onSave;

    modalFooter.appendChild(cancelButton);
    modalFooter.appendChild(saveButton);

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalOverlay.appendChild(modalContent);

    modalContainer.appendChild(modalOverlay);
    modalContainer.classList.remove('hidden');

    // Close modal on escape key press
    document.addEventListener('keydown', handleEscKey);
}

export function hideModal() {
    const modalContainer = document.getElementById('modal-container');
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.remove();
    }
    if (modalContainer) {
        modalContainer.classList.add('hidden');
    }
    document.removeEventListener('keydown', handleEscKey);
}

function handleEscKey(event) {
    if (event.key === 'Escape') {
        hideModal();
    }
}
