export const audio = (() => {

    /**
     * @type {HTMLElement|null}
     */
    let music = null;

    /**
     * @type {HTMLAudioElement|null}
     */
    let audioEl = null;

    let isPlay = false;

    const statePlay = '<i class="fa-solid fa-circle-pause spin-button"></i>';
    const statePause = '<i class="fa-solid fa-circle-play"></i>';

    /**
     * @returns {Promise<void>}
     */
    const play = async () => {
        if (!navigator.onLine) {
            return;
        }

        music.disabled = true;
        try {
            await audioEl.play();
            isPlay = true;
            music.disabled = false;
            music.innerHTML = statePlay;
        } catch (err) {
            isPlay = false;
            alert(err);
        }
    };

    /**
     * @returns {void}
     */
    const pause = () => {
        isPlay = false;
        audioEl.pause();
        music.innerHTML = statePause;
    };

    /**
     * @returns {void}
     */
    const init = () => {
        music = document.getElementById('button-music');
        music.style.display = 'block';

        audioEl = new Audio(music.getAttribute('data-url'));
        audioEl.volume = 1;
        audioEl.loop = true;
        audioEl.muted = false;
        audioEl.currentTime = 0;
        audioEl.autoplay = false;
        audioEl.controls = false;

        audioEl.addEventListener('canplay', play);
        music.addEventListener('offline', pause);
        music.addEventListener('click', () => isPlay ? pause() : play());
    };

    return {
        init,
    };
})();