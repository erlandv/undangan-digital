export const util = (() => {

    /**
     * @param {string} unsafe
     * @returns {string}
     */
    const escapeHtml = (unsafe) => {
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    /**
     * @param {function} callback
     * @param {number} timeout
     * @returns {void}
     */
    const timeOut = (callback, timeout) => {
        let clear = null;
        const c = () => {
            callback();
            clearTimeout(clear);
            clear = null;
        };

        clear = setTimeout(c, timeout);
    };

    /**
     * @param {HTMLElement} button
     * @param {string} [message='Loading']
     * @returns {object}
     */
    const disableButton = (button, message = 'Loading') => {
        button.disabled = true;

        const tmp = button.innerHTML;
        button.innerHTML = `<span class="spinner-border spinner-border-sm my-0 ms-0 me-1 p-0" style="height: 0.8rem; width: 0.8rem"></span>${message}`;

        return {
            restore: () => {
                button.innerHTML = tmp;
                button.disabled = false;
            },
        };
    };

    /**
     * @param {HTMLElement} checkbox
     * @returns {object}
     */
    const disableCheckbox = (checkbox) => {
        checkbox.disabled = true;

        const label = document.querySelector(`label[for="${checkbox.id}"]`);
        const tmp = label.innerHTML;
        label.innerHTML = `<span class="spinner-border spinner-border-sm my-0 ms-0 me-1 p-0" style="height: 0.8rem; width: 0.8rem"></span>${tmp}`;

        return {
            restore: () => {
                label.innerHTML = tmp;
                checkbox.disabled = false;
            },
        };
    };

    /**
     * @param {HTMLElement} button
     * @param {string} [message=null]
     * @param {number} [timeout=1500]
     * @returns {Promise<void>}
     */
    const copy = async (button, message = null, timeout = 1500) => {
        const data = button.getAttribute('data-copy');

        if (!data || data.length === 0) {
            alert('Nothing to copy');
            return;
        }

        button.disabled = true;

        try {
            await navigator.clipboard.writeText(data);
        } catch {
            button.disabled = false;
            alert('Failed to copy');
            return;
        }

        const tmp = button.innerHTML;
        button.innerHTML = message ? message : '<i class="fa-solid fa-check"></i>';

        timeOut(() => {
            button.disabled = false;
            button.innerHTML = tmp;
        }, timeout);
    };

    /**
     * @param {string} str
     * @returns {string}
     */
    const base64Encode = (str) => {
        const encoder = new TextEncoder();
        const encodedBytes = encoder.encode(str);
        return window.btoa(String.fromCharCode(...encodedBytes));
    };

    /**
     * @param {string} str
     * @returns {string}
     */
    const base64Decode = (str) => {
        const decoder = new TextDecoder();
        const decodedBytes = Uint8Array.from(window.atob(str), (c) => c.charCodeAt(0));
        return decoder.decode(decodedBytes);
    };

    /**
     * @param {string} userAgent 
     * @returns {string}
     */
    const parseUserAgent = (userAgent) => {
        const deviceTypes = [
            { type: 'Mobile', regex: /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i },
            { type: 'Tablet', regex: /iPad|Android(?!.*Mobile)|Tablet/i },
            { type: 'Desktop', regex: /Windows NT|Macintosh|Linux/i },
        ];

        const browsers = [
            { name: 'Chrome', regex: /Chrome|CriOS/i },
            { name: 'Safari', regex: /Safari/i },
            { name: 'Edge', regex: /Edg|Edge/i },
            { name: 'Firefox', regex: /Firefox|FxiOS/i },
            { name: 'Opera', regex: /Opera|OPR/i },
            { name: 'Internet Explorer', regex: /MSIE|Trident/i },
        ];

        const operatingSystems = [
            { name: 'Windows', regex: /Windows NT ([\d.]+)/i },
            { name: 'MacOS', regex: /Mac OS X ([\d_]+)/i },
            { name: 'Android', regex: /Android ([\d.]+)/i },
            { name: 'iOS', regex: /OS ([\d_]+) like Mac OS X/i },
            { name: 'Linux', regex: /Linux/i },
        ];

        const deviceType = deviceTypes.find((i) => i.regex.test(userAgent))?.type || 'Unknown';
        const browser = browsers.find((i) => i.regex.test(userAgent))?.name || 'Unknown';
        const osMatch = operatingSystems.find((i) => i.regex.test(userAgent));

        let osVersion = osMatch ? (userAgent.match(osMatch.regex)?.[1]?.replace(/_/g, '.') || '') : '';

        const os = osMatch ? osMatch.name : 'Unknown';
        osVersion = osVersion ? `${os} ${osVersion}` : os;

        return `${browser} ${deviceType} ${osVersion}`;
    };

    return {
        copy,
        timeOut,
        escapeHtml,
        base64Encode,
        base64Decode,
        disableButton,
        disableCheckbox,
        parseUserAgent,
    };
})();