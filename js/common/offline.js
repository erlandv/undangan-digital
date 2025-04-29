export const offline = (() => {

    /**
     * @type {HTMLElement|null}
     */
    let alert = null;
    let online = true;

    /**
     * @returns {boolean}
     */
    const isOnline = () => online;

    /**
     * @param {boolean} isUp 
     * @returns {Promise<void>}
     */
    const show = (isUp) => new Promise((res) => {
        let op = parseFloat(alert.style.opacity);
        let clear = null;

        const step = isUp ? 0.05 : -0.05;
        const target = isUp ? 1 : 0;

        const callback = () => {
            op = Math.max(0, Math.min(1, op + step));
            alert.style.opacity = op.toFixed(2);

            if (op === target) {
                res();
                clearInterval(clear);
                clear = null;
            }
        };

        clear = setInterval(callback, 10);
    });

    /**
     * @returns {void}
     */
    const setOffline = () => {
        const el = alert.firstElementChild.firstElementChild;
        el.classList.remove('bg-success');
        el.classList.add('bg-danger');
        el.firstElementChild.innerHTML = '<i class="fa-solid fa-ban me-2"></i>Koneksi tidak tersedia';
    };

    /**
     * @returns {void}
     */
    const setOnline = () => {
        const el = alert.firstElementChild.firstElementChild;
        el.classList.remove('bg-danger');
        el.classList.add('bg-success');
        el.firstElementChild.innerHTML = '<i class="fa-solid fa-cloud me-2"></i>Koneksi tersedia kembali';
    };

    /**
     * @returns {Promise<void>}
     */
    const setDefaultState = async () => {
        await show(false);
        setOffline();
    };

    /**
     * @returns {void}
     */
    const hide = () => {
        let t = null;
        t = setTimeout(() => {
            clearTimeout(t);
            t = null;

            if (online) {
                setDefaultState();
            }
        }, 3000);
    };

    /**
     * @returns {void}
     */
    const changeState = () => {
        const classes = [
            'input[data-offline-disabled]',
            'button[data-offline-disabled]',
            'select[data-offline-disabled]',
            'textarea[data-offline-disabled]'
        ].join(', ');

        document.querySelectorAll(classes).forEach((e) => {

            e.dispatchEvent(new Event(isOnline() ? 'online' : 'offline'));
            e.setAttribute('data-offline-disabled', isOnline() ? 'false' : 'true');

            if (e.tagName === 'BUTTON') {
                isOnline() ? e.classList.remove('disabled') : e.classList.add('disabled');
            } else {
                isOnline() ? e.removeAttribute('disabled') : e.setAttribute('disabled', 'true');
            }
        });
    };

    /**
     * @returns {void}
     */
    const onOffline = () => {
        online = false;

        setOffline();
        show(true);
        changeState();
    };

    /**
     * @returns {void}
     */
    const onOnline = () => {
        online = true;

        setOnline();
        hide();
        changeState();
    };

    /**
     * @returns {void}
     */
    const init = () => {
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        alert = document.getElementById('offline-mode');
        alert.innerHTML = `
        <div class="d-flex justify-content-center mx-auto">
            <div class="d-flex justify-content-center align-items-center rounded-pill my-2 bg-danger shadow">
                <small class="text-center py-1 px-2 mx-1 mt-1 mb-0 text-white" style="font-size: 0.8rem;"></small>
            </div>
        </div>`;
    };

    return {
        init,
        isOnline,
    };
})();