import { comment } from './comment.js';

export const pagination = (() => {

    let perPage = 10;
    let pageNow = 0;
    let resultData = 0;

    /**
     * @type {HTMLElement|null}
     */
    let page = null;

    /**
     * @type {HTMLElement|null}
     */
    let liPrev = null;

    /**
     * @type {HTMLElement|null}
     */
    let liNext = null;

    /**
     * @type {HTMLElement|null}
     */
    let paginate = null;

    /**
     * @param {number} num 
     * @returns {void}
     */
    const setPer = (num) => {
        perPage = Number(num);
    };

    /**
     * @returns {number}
     */
    const getPer = () => perPage;

    /**
     * @returns {number}
     */
    const getNext = () => pageNow;

    /**
     * @returns {number}
     */
    const getResultData = () => resultData;

    /**
     * @returns {void}
     */
    const disabledPrevious = () => !liPrev.classList.contains('disabled') ? liPrev.classList.add('disabled') : null;

    /**
     * @returns {void}
     */
    const enablePrevious = () => liPrev.classList.contains('disabled') ? liPrev.classList.remove('disabled') : null;

    /**
     * @returns {void}
     */
    const disabledNext = () => !liNext.classList.contains('disabled') ? liNext.classList.add('disabled') : null;

    /**
     * @returns {void}
     */
    const enableNext = () => liNext.classList.contains('disabled') ? liNext.classList.remove('disabled') : null;

    /**
     * @returns {void}
     */
    const enablePagination = () => {
        if (paginate.classList.contains('d-none')) {
            paginate.classList.remove('d-none');
        }
    };

    /**
     * @param {HTMLButtonElement} button 
     * @returns {object}
     */
    const buttonAction = (button) => {
        button.disabled = true;
        const tmp = button.innerHTML;
        button.innerHTML = `<span class="spinner-border spinner-border-sm my-0 mx-1 p-0" style="height: 0.8rem; width: 0.8rem;"></span>`;

        const process = async () => {
            await comment.show();

            button.disabled = false;
            button.innerHTML = tmp;

            comment.scroll();
        };

        const next = async () => {
            pageNow += perPage;

            button.innerHTML = 'Next' + button.innerHTML;
            await process();
            page.innerText = String(parseInt(page.innerText) + 1);
        };

        const prev = async () => {
            pageNow -= perPage;

            button.innerHTML = button.innerHTML + 'Prev';
            await process();
            page.innerText = String(parseInt(page.innerText) - 1);
        };

        return {
            next,
            prev,
        };
    };

    /**
     * @returns {Promise<boolean>}
     */
    const reset = async () => {
        if (pageNow === 0) {
            return false;
        }

        pageNow = 0;
        resultData = 0;
        page.innerText = 1;

        disabledNext();
        disabledPrevious();
        await comment.show();

        return true;
    };

    /**
     * @param {number} len 
     * @returns {void}
     */
    const setResultData = (len) => {
        resultData = len;

        if (pageNow > 0) {
            enablePrevious();
        }

        if (resultData < perPage) {
            disabledNext();
            return;
        }

        enableNext();
        enablePagination();
    };

    /**
     * @param {HTMLButtonElement} button 
     * @returns {Promise<void>}
     */
    const previous = async (button) => {
        disabledPrevious();

        if (pageNow < 0) {
            return;
        }

        disabledNext();
        await buttonAction(button).prev();
    };

    /**
     * @param {HTMLButtonElement} button 
     * @returns {Promise<void>}
     */
    const next = async (button) => {
        disabledNext();

        if (resultData < perPage) {
            return;
        }

        disabledPrevious();
        await buttonAction(button).next();
    };

    /**
     * @returns {void}
     */
    const init = () => {
        paginate = document.getElementById('pagination');
        paginate.innerHTML = `
        <ul class="pagination mb-2 shadow-sm rounded-4">
            <li class="page-item disabled" id="previous">
                <button class="page-link rounded-start-4" onclick="undangan.comment.pagination.previous(this)" data-offline-disabled="false">
                    <i class="fa-solid fa-circle-left me-1"></i>Sebelumnya
                </button>
            </li>
            <li class="page-item disabled">
                <span class="page-link text-theme-auto" id="page">1</span>
            </li>
            <li class="page-item" id="next">
                <button class="page-link rounded-end-4" onclick="undangan.comment.pagination.next(this)" data-offline-disabled="false">
                    Berikutnya<i class="fa-solid fa-circle-right ms-1"></i>
                </button>
            </li>
        </ul>`;

        page = document.getElementById('page');
        liPrev = document.getElementById('previous');
        liNext = document.getElementById('next');
    };

    return {
        init,
        setPer,
        getPer,
        getNext,
        reset,
        setResultData,
        getResultData,
        previous,
        next,
    };
})();
