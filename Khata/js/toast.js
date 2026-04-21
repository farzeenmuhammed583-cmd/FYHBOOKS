(function() {
    'use strict';

    const TOAST_CONTAINER_ID = 'toast-container';
    const TOAST_TYPE_COLORS = {
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    const TOAST_TYPE_ICONS = {
        success: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    function getToastContainer() {
        let container = document.getElementById(TOAST_CONTAINER_ID);
        if (!container) {
            container = document.createElement('div');
            container.id = TOAST_CONTAINER_ID;
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function createToastElement(message, type, duration) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        const color = TOAST_TYPE_COLORS[type] || TOAST_TYPE_COLORS.info;
        const icon = TOAST_TYPE_ICONS[type] || TOAST_TYPE_ICONS.info;

        toast.innerHTML = `
            <div class="toast-icon" style="color: ${color}">${icon}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
            <button class="toast-close" aria-label="Dismiss notification" style="color: ${color}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div class="toast-progress" style="background-color: ${color}"></div>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => dismissToast(toast));

        return toast;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showToast(message, type = 'info', duration = 4000) {
        return new Promise((resolve) => {
            const container = getToastContainer();
            const toast = createToastElement(message, type, duration);

            container.appendChild(toast);

            requestAnimationFrame(() => {
                toast.classList.add('toast-enter');
            });

            let timeoutId;
            let dismissed = false;

            const dismiss = () => {
                if (dismissed) return;
                dismissed = true;
                clearTimeout(timeoutId);
                toast.classList.add('toast-exit');
                toast.addEventListener('animationend', () => {
                    toast.remove();
                    resolve();
                }, { once: true });
            };

            timeoutId = setTimeout(dismiss, duration);

            toast._dismiss = dismiss;
            toast._timeoutId = timeoutId;
        });
    }

    function showSuccess(message, duration) {
        return showToast(message, 'success', duration);
    }

    function showError(message, duration) {
        return showToast(message, 'error', duration);
    }

    function showWarning(message, duration) {
        return showToast(message, 'warning', duration);
    }

    function showInfo(message, duration) {
        return showToast(message, 'info', duration);
    }

    function dismissToast(toastElement) {
        if (toastElement && typeof toastElement._dismiss === 'function') {
            toastElement._dismiss();
        }
    }

    function dismissAllToasts() {
        const container = document.getElementById(TOAST_CONTAINER_ID);
        if (!container) return;

        const toasts = container.querySelectorAll('.toast');
        toasts.forEach((toast) => {
            if (typeof toast._dismiss === 'function') {
                toast._dismiss();
            }
        });
    }

    window.showToast = showToast;
    window.showSuccess = showSuccess;
    window.showError = showError;
    window.showWarning = showWarning;
    window.showInfo = showInfo;
    window.dismissToast = dismissToast;
    window.dismissAllToasts = dismissAllToasts;
})();
