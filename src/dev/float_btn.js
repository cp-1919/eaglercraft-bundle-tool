export function createFloatingActionButton(clickHandler) {
    // Floating Action Button with Drag & Drop and Auto-Restore
    // Pure JavaScript, no external dependencies
    function getClickHandler() {
        return (typeof clickHandler === 'function')
            ? clickHandler
            : function() {
                console.log('error: no click handler defined for floating button');
            };
    }

    // ----- Button Creation -----
    function createButtonElement() {
        const btn = document.createElement('div');
        btn.id = 'floating-action-btn';
        btn.textContent = '🔧';
        return btn;
    }

    // ----- Style Injection -----
    const style = document.createElement('style');
    style.textContent = `
        #floating-action-btn {
            position: fixed;
            width: 56px;
            height: 56px;
            background-color: #6c757d;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: bold;
            cursor: grab;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 10000;
            user-select: none;
            touch-action: none;
            transition: box-shadow 0.2s ease, background-color 0.2s ease;
            text-align: center;
            line-height: 1;
        }
        #floating-action-btn:active {
            cursor: grabbing;
            box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        #floating-action-btn:hover {
            background-color: #5a6268;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        }
        #floating-action-btn.dragging {
            transition: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
    `;
    if (!document.querySelector('#floating-action-btn-style')) {
        style.id = 'floating-action-btn-style';
        document.head.appendChild(style);
    }

    let button = null;
    let isDragging = false;
    let dragTriggered = false;
    let startMouseX = 0, startMouseY = 0;
    let startLeft = 0, startTop = 0;
    const dragThreshold = 5;

    let endingDrag = false;

    function getButtonPosition() {
        const left = parseFloat(button.style.left);
        const top = parseFloat(button.style.top);
        return { left: isNaN(left) ? 0 : left, top: isNaN(top) ? 0 : top };
    }

    function setButtonPosition(left, top) {
        const maxX = window.innerWidth - button.offsetWidth;
        const maxY = window.innerHeight - button.offsetHeight;
        left = Math.min(Math.max(0, left), maxX);
        top = Math.min(Math.max(0, top), maxY);
        button.style.left = left + 'px';
        button.style.top = top + 'px';
    }

    function initDefaultPosition() {
        const left = window.innerWidth - button.offsetWidth - 20;
        const top = window.innerHeight - button.offsetHeight - 20;
        setButtonPosition(left, top);
    }

    function endDrag() {
        if (!isDragging) return;
        if (endingDrag) return;
        endingDrag = true;

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('touchcancel', onTouchEnd);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        document.removeEventListener('touchcancel', onTouchEnd);

        document.body.style.userSelect = '';
        if (button) {
            button.style.cursor = 'grab';
            button.classList.remove('dragging');
        }

        if (button) trackPosition();

        isDragging = false;
        endingDrag = false;
    }

    function startDrag(clientX, clientY) {
        if (isDragging) return;
        isDragging = true;
        dragTriggered = false;
        startMouseX = clientX;
        startMouseY = clientY;
        const { left, top } = getButtonPosition();
        startLeft = left;
        startTop = top;

        button.classList.add('dragging');
        button.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);
        window.addEventListener('touchcancel', onTouchEnd);
    }

    function onDragMove(clientX, clientY) {
        if (!isDragging) return;

        if (clientX < 0 || clientY < 0 || clientX > window.innerWidth || clientY > window.innerHeight) {
            endDrag();
            return;
        }

        const deltaX = clientX - startMouseX;
        const deltaY = clientY - startMouseY;

        if (!dragTriggered && (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold)) {
            dragTriggered = true;
        }

        let newLeft = startLeft + deltaX;
        let newTop = startTop + deltaY;

        const maxX = window.innerWidth - button.offsetWidth;
        const maxY = window.innerHeight - button.offsetHeight;
        newLeft = Math.min(Math.max(0, newLeft), maxX);
        newTop = Math.min(Math.max(0, newTop), maxY);

        button.style.left = newLeft + 'px';
        button.style.top = newTop + 'px';
    }

    function onMouseDown(e) {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        startDrag(e.clientX, e.clientY);
    }

    function onMouseMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        onDragMove(e.clientX, e.clientY);
    }

    function onMouseUp(e) {
        if (!isDragging) return;
        e.preventDefault();
        endDrag();
    }

    function onTouchStart(e) {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        if (touch) startDrag(touch.clientX, touch.clientY);
    }

    function onTouchMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) onDragMove(touch.clientX, touch.clientY);
    }

    function onTouchEnd(e) {
        if (!isDragging) return;
        e.preventDefault();
        endDrag();
    }

    function onClickHandler(e) {
        if (dragTriggered) {
            dragTriggered = false;
            return;
        }
        const handler = getClickHandler();
        handler(e);
    }

    function bindEvents(btn) {
        btn.addEventListener('mousedown', onMouseDown);
        btn.addEventListener('touchstart', onTouchStart, { passive: false });
        btn.addEventListener('click', onClickHandler);
    }

    let lastLeft = null, lastTop = null;

    function trackPosition() {
        if (!button) return;
        const left = parseFloat(button.style.left);
        const top = parseFloat(button.style.top);
        if (!isNaN(left)) lastLeft = left;
        if (!isNaN(top)) lastTop = top;
    }

    function restoreButton() {
        if (button && document.body.contains(button)) return;

        if (button && button.parentNode) {
            button.parentNode.removeChild(button);
        }

        const newBtn = createButtonElement();
        if (lastLeft !== null && lastTop !== null) {
            newBtn.style.left = lastLeft + 'px';
            newBtn.style.top = lastTop + 'px';
        }
        button = newBtn;
        bindEvents(button);
        document.body.appendChild(button);

        if (lastLeft === null || lastTop === null) {
            initDefaultPosition();
            trackPosition();
        } else {
            setButtonPosition(lastLeft, lastTop);
            trackPosition();
        }
    }

    let observer = null;
    function setupObserver() {
        if (observer) observer.disconnect();
        observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.removedNodes.length) {
                    const removed = Array.from(mutation.removedNodes);
                    if (button && removed.includes(button)) {
                        restoreButton();
                        break;
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: false });
    }

    function onWindowResize() {
        if (button && document.body.contains(button)) {
            const { left, top } = getButtonPosition();
            setButtonPosition(left, top);
            trackPosition();
        }
    }

    function init() {
        button = createButtonElement();
        bindEvents(button);
        document.body.appendChild(button);
        initDefaultPosition();
        trackPosition();

        window.addEventListener('resize', onWindowResize);
        setupObserver();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}