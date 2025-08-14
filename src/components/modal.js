/**
 * Creates and displays a modal dialog.
 *
 * @param {string} title - The title of the modal.
 * @param {HTMLElement} content - The HTML element to be displayed as the modal's content.
 * @param {Array<Object>} actions - An array of action buttons. Each object should have `label` and `onClick` properties.
 * @returns {() => void} A function to close the modal.
 */
export function showModal(title, content, actions = []) {
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50';
    modalBackdrop.id = 'modal-backdrop';

    const modalContainer = document.createElement('div');
    modalContainer.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4';

    const modalHeader = document.createElement('h3');
    modalHeader.className = 'text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100';
    modalHeader.textContent = title;

    const modalContent = document.createElement('div');
    modalContent.appendChild(content);

    const modalFooter = document.createElement('div');
    modalFooter.className = 'mt-6 flex justify-end space-x-3';

    const closeModal = () => {
        document.body.removeChild(modalBackdrop);
    };

    actions.forEach(action => {
        const button = document.createElement('button');
        button.className = action.className || 'px-4 py-2 rounded';
        button.textContent = action.label;
        button.onclick = (e) => {
            action.onClick(e, closeModal);
        };
        modalFooter.appendChild(button);
    });

    modalContainer.appendChild(modalHeader);
    modalContainer.appendChild(modalContent);
    modalContainer.appendChild(modalFooter);
    modalBackdrop.appendChild(modalContainer);

    // Close modal on backdrop click
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
            closeModal();
        }
    });

    document.body.appendChild(modalBackdrop);

    return closeModal;
}
