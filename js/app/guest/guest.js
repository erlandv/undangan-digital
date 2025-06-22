import { image } from './image.js';
import { audio } from './audio.js';
import { progress } from './progress.js';
import { util } from '../../common/util.js';
import { bs } from '../../libs/bootstrap.js';
import { theme } from '../../common/theme.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';
import { offline } from '../../common/offline.js';
import { comment } from '../component/comment.js';
import { basicAnimation, openAnimation } from '../../libs/confetti.js';

export const guest = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let information = null;

    /**
     * @returns {void}
     */
    const countDownDate = () => {
        const until = document.getElementById('count-down')?.getAttribute('data-time')?.replace(' ', 'T');
        if (!until) {
            alert('invalid count down date.');
            return;
        }

        const count = (new Date(until)).getTime();

        setInterval(() => {
            const distance = Math.abs(count - Date.now());

            document.getElementById('day').innerText = Math.floor(distance / (1000 * 60 * 60 * 24)).toString();
            document.getElementById('hour').innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString();
            document.getElementById('minute').innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString();
            document.getElementById('second').innerText = Math.floor((distance % (1000 * 60)) / 1000).toString();
        }, 1000);
    };

    /**
     * @param {string} id
     * @param {number} speed
     * @returns {void}
     */
    const opacity = (id, speed = 0.01) => {
        const el = document.getElementById(id);
        let op = parseFloat(el.style.opacity);

        let clear = null;
        const callback = () => {
            if (op > 0) {
                el.style.opacity = op.toFixed(3);
                op -= speed;
                return;
            }

            clearInterval(clear);
            clear = null;
            el.remove();
        };

        clear = setInterval(callback, 10);
    };

    /**
     * @returns {void}
     */
    const showGuestName = () => {
        /**
         * Make sure "to=" is the last query string.
         * Ex. ulems.my.id/?id=some-uuid-here&to=name
         */
        const raw = window.location.search.split('to=');
        let name = null;

        if (raw.length > 1 && raw[1].length >= 1) {
            name = window.decodeURIComponent(raw[1]);
        }

        if (name) {
            const guestName = document.getElementById('guest-name');
            const div = document.createElement('div');
            div.classList.add('m-2');
            div.innerHTML = `<small class="mt-0 mb-1 mx-0 p-0">${guestName?.getAttribute('data-message')}</small><p class="m-0 p-0" style="font-size: 1.5rem">${util.escapeHtml(name)}</p>`;

            guestName?.appendChild(div);
        }

        const form = document.getElementById('form-name');
        if (form) {
            form.value = information.get('name') ?? name;
        }
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const open = (button) => {
        button.disabled = true;
        document.body.scrollIntoView({ behavior: 'instant' });

        if (theme.isAutoMode()) {
            document.getElementById('button-theme').style.display = 'block';
        }

        audio.init();
        theme.spyTop();

        basicAnimation();
        opacity('welcome', 0.025);
        util.timeOut(openAnimation, 1500);
    };

    /**
     * @param {HTMLImageElement} img
     * @returns {void}
     */
    const modal = (img) => {
        const m = document.getElementById('show-modal-image');
        m.src = img.src;
        m.width = img.width;
        m.height = img.height;
        bs.modal('modal-image').show();
    };

    /**
     * @returns {void}
     */
    const closeInformation = () => information.set('info', true);

    /**
     * @returns {void}
     */
    const normalizeArabicFont = () => {
        document.querySelectorAll('.font-arabic').forEach((el) => {
            el.innerHTML = String(el.innerHTML).normalize('NFC');
        });
    };

    /**
     * @returns {void}
     */
    const animateSvg = () => {
        document.querySelectorAll('svg').forEach((el) => {
            util.timeOut(() => el.classList.add(el.getAttribute('data-class')), parseInt(el.getAttribute('data-time')));
        });
    };

    /**
     * @returns {void}
     */
    const buildGoogleCalendar = () => {
        /**
         * @param {string} d 
         * @returns {string}
         */
        const formatDate = (d) => (new Date(d + ':00Z')).toISOString().replace(/[-:]/g, '').split('.')[0];

        const buildGoogleCalendarURL = () => {
            const url = new URL('https://calendar.google.com/calendar/render');
            const data = {
                action: 'TEMPLATE',
                text: 'The Wedding of Tari and Erland',
                dates: `${formatDate('2025-07-24 10:00')}/${formatDate('2025-07-24 14:00')}`,
                details: 'Tanpa mengurangi rasa hormat, dengan ini kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada acara pernikahan kami.',
                location: 'https://maps.app.goo.gl/PtFWJys9FF6fkzhG7',
                ctz: 'Asia/Jakarta',
            };
            Object.entries(data).forEach(([k, v]) => url.searchParams.set(k, v));
            return url.toString();
        };

        const isAppleDevice = () => {
            const ua = navigator.userAgent || window.navigator.userAgent;
            return /iPad|iPhone|iPod|Macintosh/.test(ua) && !window.MSStream;
        };

        document.querySelector('#addToCalendar')?.addEventListener('click', () => {
            if (isAppleDevice()) {
                window.location.href = 'https://tari.erland.me/wedding.ics'; // iOS / macOS → Apple Calendar
            } else {
                const url = buildGoogleCalendarURL();
                window.open(url, '_blank'); // Android / lainnya → Google Calendar
            }
        });
    };

    document.addEventListener('DOMContentLoaded', buildGoogleCalendar);

    /**
     * @returns {void}
     */
    const booting = () => {
        animateSvg();
        countDownDate();
        showGuestName();
        normalizeArabicFont();
        buildGoogleCalendar();
        document.getElementById('root').style.opacity = '1';

        if (information.has('presence')) {
            document.getElementById('form-presence').value = information.get('presence') ? '1' : '2';
        }

        if (information.get('info')) {
            document.getElementById('information')?.remove();
        }

        window.AOS.init();
        document.body.scrollIntoView({ behavior: 'instant' });

        // remove loading screen and show welcome screen.
        opacity('loading', 0.025);
    };

    /**
     * @returns {void}
     */
    const domLoaded = () => {
        offline.init();
        progress.init();
        information = storage('information');
        const token = document.body.getAttribute('data-key');

        // document.addEventListener('progress.done', () => booting());
        booting();
        document.addEventListener('hide.bs.modal', () => document.activeElement?.blur());

        if (!token || token.length <= 0) {
            image.init().load();
            document.getElementById('comment')?.remove();
            document.querySelector('a.nav-link[href="#comment"]')?.closest('li.nav-item')?.remove();
        }

        if (token.length > 0) {
            // add 2 progress for config and comment.
            // before img.load();
            progress.add();
            progress.add();

            const img = image.init();
            if (!img.hasDataSrc()) {
                img.load();
            }

            const params = new URLSearchParams(window.location.search);
            session.setToken(params.get('k') ?? token);

            // fetch after document is loaded.
            window.addEventListener('load', () => session.guest().then(() => {
                progress.complete('config');

                if (img.hasDataSrc()) {
                    img.load();
                }

                comment.init();
                comment.show()
                    .then(() => progress.complete('comment'))
                    .catch(() => progress.invalid('comment'));
            }).catch(() => progress.invalid('config')));
        }
    };

    /**
     * @returns {object}
     */
    const init = () => {
        theme.init();
        session.init();

        if (session.isAdmin()) {
            storage('user').clear();
            storage('owns').clear();
            storage('likes').clear();
            storage('session').clear();
            storage('comment').clear();
            storage('tracker').clear();
        }

        window.addEventListener('DOMContentLoaded', domLoaded);

        return {
            util,
            theme,
            comment,
            guest: {
                open,
                modal,
                closeInformation,
            },
        };
    };

    return {
        init,
    };
})();