// config-window.js
// Configuration window creator with grey style matching floating button.
// No global pollution. All UI strings and comments in English.

/**
 * Creates a configuration modal window.
 * @param {function} callback - Function called on export with (gameName, iconBase64, resetOnStart)
 */
export function createConfigWindow(callback) {
    // Validate callback
    const onExport = (typeof callback === 'function') ? callback : () => {
        console.warn('Config window: no valid callback provided');
    };

    // ----- DOM Elements -----
    let overlay = null;
    let modal = null;
    let isDragging = false;
    let dragOffsetX = 0, dragOffsetY = 0;

    // ----- Game name state -----
    let currentGameName = '';          // stored game name
    let gameNameDisplaySpan = null;    // reference to the display span

    // ----- Helper: Convert uploaded file to Base64 (with data URL header) -----
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file || file.type !== 'image/png') {
                reject(new Error('Only PNG files are allowed'));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    // ----- Update game name display -----
    function updateGameNameDisplay() {
        if (gameNameDisplaySpan) {
            gameNameDisplaySpan.textContent = currentGameName || '(not set)';
        }
    }

    // ----- Open prompt to set game name -----
    function promptForGameName() {
        let newName = prompt('Enter game name:', currentGameName);
        if (newName !== null) {
            newName = newName.trim();
            if (newName === '') {
                alert('Game name cannot be empty.');
                return;
            }
            currentGameName = newName;
            updateGameNameDisplay();
        }
    }

    // ----- Build UI -----
    function buildModal() {
        // Overlay (background dim)
        overlay = document.createElement('div');
        overlay.className = 'config-overlay';
        
        // Modal container
        modal = document.createElement('div');
        modal.className = 'config-modal';
        
        // Title bar (draggable handle)
        const titleBar = document.createElement('div');
        titleBar.className = 'config-titlebar';
        titleBar.textContent = 'Game Configuration';
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'config-close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', 'Close');
        titleBar.appendChild(closeBtn);
        
        // Content area
        const content = document.createElement('div');
        content.className = 'config-content';
        
        // Game name section (button + display)
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Game Name';
        
        const nameControlRow = document.createElement('div');
        nameControlRow.className = 'config-name-row';
        
        gameNameDisplaySpan = document.createElement('span');
        gameNameDisplaySpan.className = 'config-name-display';
        updateGameNameDisplay(); // initial display
        
        const setNameBtn = document.createElement('button');
        setNameBtn.type = 'button';
        setNameBtn.className = 'config-name-btn';
        setNameBtn.textContent = 'Set Game Name';
        setNameBtn.addEventListener('click', promptForGameName);
        
        nameControlRow.appendChild(gameNameDisplaySpan);
        nameControlRow.appendChild(setNameBtn);
        
        // Icon upload field
        const iconLabel = document.createElement('label');
        iconLabel.textContent = 'Icon (PNG only)';
        iconLabel.htmlFor = 'config-icon-upload';
        const iconInput = document.createElement('input');
        iconInput.type = 'file';
        iconInput.id = 'config-icon-upload';
        iconInput.accept = 'image/png';
        
        // Base64 preview (hidden, stores result)
        let iconBase64 = '';
        const iconStatus = document.createElement('span');
        iconStatus.className = 'config-icon-status';
        iconStatus.textContent = 'No file chosen';
        
        // Reset option checkbox
        const resetLabel = document.createElement('label');
        resetLabel.className = 'config-checkbox-label';
        const resetCheckbox = document.createElement('input');
        resetCheckbox.type = 'checkbox';
        resetCheckbox.id = 'config-reset';
        resetCheckbox.checked = false;
        const resetSpan = document.createElement('span');
        resetSpan.textContent = 'Reset on start';
        resetLabel.appendChild(resetCheckbox);
        resetLabel.appendChild(resetSpan);
        
        // Export button
        const exportBtn = document.createElement('button');
        exportBtn.className = 'config-export-btn';
        exportBtn.textContent = 'Export';
        
        // Assemble
        content.appendChild(nameLabel);
        content.appendChild(nameControlRow);
        content.appendChild(iconLabel);
        content.appendChild(iconInput);
        content.appendChild(iconStatus);
        content.appendChild(resetLabel);
        content.appendChild(exportBtn);
        
        modal.appendChild(titleBar);
        modal.appendChild(content);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // ----- Event Handlers -----
        // Close button
        closeBtn.addEventListener('click', destroy);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) destroy();
        });
        
        // Icon upload
        iconInput.addEventListener('change', async (e) => {
            const file = iconInput.files[0];
            if (!file) {
                iconStatus.textContent = 'No file chosen';
                iconBase64 = '';
                return;
            }
            try {
                iconBase64 = await fileToBase64(file);
                iconStatus.textContent = `✓ ${file.name}`;
                iconStatus.style.color = '#2e7d32';
            } catch (err) {
                iconStatus.textContent = `✗ ${err.message}`;
                iconStatus.style.color = '#c62828';
                iconBase64 = '';
            }
        });
        
        // Export button
        exportBtn.addEventListener('click', () => {
            if (!currentGameName) {
                alert('Please set a game name first (click "Set Game Name")');
                return;
            }
            // Invoke callback with data
            onExport(currentGameName, iconBase64, resetCheckbox.checked);
            destroy(); // Auto-close after export
        });
        
        // Dragging (title bar)
        titleBar.addEventListener('mousedown', onDragStart);
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        
        // Prevent text selection while dragging
        titleBar.addEventListener('selectstart', (e) => e.preventDefault());
        
        // Center modal initially
        centerModal();
        window.addEventListener('resize', centerModal);
        
        return modal;
    }
    
    // ----- Dragging Logic -----
    function onDragStart(e) {
        // Only left button, ignore if target is close button
        if (e.button !== 0 || e.target.classList.contains('config-close-btn')) return;
        e.preventDefault();
        
        const rect = modal.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        isDragging = true;
        modal.style.cursor = 'grabbing';
        modal.style.transition = 'none';
    }
    
    function onDragMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        let left = e.clientX - dragOffsetX;
        let top = e.clientY - dragOffsetY;
        
        // Keep within viewport
        const maxX = window.innerWidth - modal.offsetWidth;
        const maxY = window.innerHeight - modal.offsetHeight;
        left = Math.min(Math.max(0, left), maxX);
        top = Math.min(Math.max(0, top), maxY);
        
        modal.style.left = left + 'px';
        modal.style.top = top + 'px';
        modal.style.transform = 'none'; // override centering transform
    }
    
    function onDragEnd() {
        if (isDragging) {
            isDragging = false;
            modal.style.cursor = '';
            modal.style.transition = '';
        }
    }
    
    function centerModal() {
        if (!modal) return;
        const width = modal.offsetWidth;
        const height = modal.offsetHeight;
        modal.style.left = `${(window.innerWidth - width) / 2}px`;
        modal.style.top = `${(window.innerHeight - height) / 2}px`;
        modal.style.transform = 'none';
    }
    
    // ----- Destroy and cleanup -----
    function destroy() {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        window.removeEventListener('resize', centerModal);
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        overlay = null;
        modal = null;
    }
    
    // ----- Inject Styles (matching floating button's grey aesthetic) -----
    function injectStyles() {
        if (document.getElementById('config-window-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'config-window-styles';
        style.textContent = `
            .config-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.3);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            }
            .config-modal {
                position: fixed;
                width: 360px;
                background-color: #f5f5f5;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                z-index: 10002;
                overflow: hidden;
                user-select: none;
                border: 1px solid #d0d0d0;
            }
            .config-titlebar {
                background-color: #6c757d;
                color: white;
                padding: 12px 16px;
                font-weight: 600;
                font-size: 16px;
                cursor: grab;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid #5a6268;
            }
            .config-titlebar:active {
                cursor: grabbing;
            }
            .config-close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                line-height: 1;
                cursor: pointer;
                padding: 0 4px;
                opacity: 0.8;
                transition: opacity 0.2s;
            }
            .config-close-btn:hover {
                opacity: 1;
                background-color: rgba(255,255,255,0.1);
                border-radius: 4px;
            }
            .config-content {
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                background-color: #ffffff;
            }
            .config-content label {
                font-weight: 500;
                color: #333;
                font-size: 14px;
                margin-bottom: -8px;
            }
            .config-name-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }
            .config-name-display {
                flex: 1;
                padding: 8px 10px;
                background-color: #f0f0f0;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                color: #333;
                word-break: break-all;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .config-name-btn {
                background-color: #6c757d;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 14px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
                white-space: nowrap;
            }
            .config-name-btn:hover {
                background-color: #5a6268;
            }
            .config-name-btn:active {
                background-color: #4e555b;
            }
            .config-content input[type="file"] {
                font-size: 14px;
                padding: 4px 0;
            }
            .config-icon-status {
                font-size: 13px;
                color: #666;
                margin-top: -8px;
                word-break: break-all;
            }
            .config-checkbox-label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-weight: normal;
                margin: 0;
            }
            .config-checkbox-label input {
                width: 18px;
                height: 18px;
                accent-color: #6c757d;
            }
            .config-export-btn {
                background-color: #6c757d;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.2s, box-shadow 0.2s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-top: 8px;
            }
            .config-export-btn:hover {
                background-color: #5a6268;
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }
            .config-export-btn:active {
                background-color: #4e555b;
            }
        `;
        document.head.appendChild(style);
    }
    
    // ----- Initialize -----
    injectStyles();
    buildModal();
}