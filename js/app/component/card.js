import { util } from '../../common/util.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';

export const card = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let user = null;

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let owns = null;

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let likes = null;

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let config = null;

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let tracker = null;

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let showHide = null;

    const maxCommentLength = 250;

    const listsMarkDown = [
        ['*', `<strong class="text-theme-auto">$1</strong>`],
        ['_', `<em class="text-theme-auto">$1</em>`],
        ['~', `<del class="text-theme-auto">$1</del>`],
        ['```', `<code class="font-monospace text-theme-auto">$1</code>`]
    ];

    /**
     * @returns {string}
     */
    const renderLoading = () => {
        return `
        <div class="bg-theme-auto shadow p-3 mx-0 mt-0 mb-3 rounded-4">
            <div class="d-flex justify-content-between align-items-center placeholder-wave">
                <span class="placeholder bg-secondary col-5 rounded-3 my-1"></span>
                <span class="placeholder bg-secondary col-3 rounded-3 my-1"></span>
            </div>
            <hr class="my-1">
            <p class="placeholder-wave m-0">
                <span class="placeholder bg-secondary col-6 rounded-3"></span>
                <span class="placeholder bg-secondary col-5 rounded-3"></span>
                <span class="placeholder bg-secondary col-12 rounded-3 my-1"></span>
            </p>
        </div>`;
    };

    /**
     * @param {string} str 
     * @returns {string}
     */
    const convertMarkdownToHTML = (str) => {
        listsMarkDown.forEach((data) => {
            const k = data[0];
            const v = data[1];
            str = str.replace(new RegExp(`\\${k}(?=\\S)(.*?)(?<!\\s)\\${k}`, 'gs'), v);
        });

        return str;
    };

    /**
     * @param {ReturnType<typeof dto.getCommentResponse>} c
     * @returns {string}
     */
    const renderLike = (c) => {
        return `
        <button style="font-size: 0.8rem;" onclick="undangan.comment.like.love(this)" data-uuid="${c.uuid}" class="btn btn-sm btn-outline-auto ms-auto rounded-3 p-0 shadow-sm d-flex justify-content-start align-items-center" data-offline-disabled="false">
            <span class="my-0 mx-1" data-count-like="${c.like.love}">${c.like.love}</span>
            <i class="me-1 ${likes.has(c.uuid) ? 'fa-solid fa-heart text-danger' : 'fa-regular fa-heart'}"></i>
        </button>`;
    };

    /**
     * @param {ReturnType<typeof dto.getCommentResponse>} c
     * @returns {string}
     */
    const renderAction = (c) => {
        let action = `<div class="d-flex justify-content-start align-items-center" data-button-action="${c.uuid}">`;

        if (config.get('can_reply') === true || config.get('can_reply') === undefined) {
            action += `<button style="font-size: 0.8rem;" onclick="undangan.comment.reply(this)" data-uuid="${c.uuid}" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1 shadow-sm" data-offline-disabled="false">Reply</button>`;
        }

        if (owns.has(c.uuid) && (config.get('can_edit') === true || config.get('can_edit') === undefined)) {
            action += `<button style="font-size: 0.8rem;" onclick="undangan.comment.edit(this)" data-uuid="${c.uuid}" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1 shadow-sm" data-offline-disabled="false">Edit</button>`;
        }

        if (session.isAdmin()) {
            action += `<button style="font-size: 0.8rem;" onclick="undangan.comment.remove(this)" data-uuid="${c.uuid}" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1 shadow-sm" data-own="${c.own}" data-offline-disabled="false">Delete</button>`;
        } else if (owns.has(c.uuid) && (config.get('can_delete') === true || config.get('can_delete') === undefined)) {
            action += `<button style="font-size: 0.8rem;" onclick="undangan.comment.remove(this)" data-uuid="${c.uuid}" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1 shadow-sm" data-offline-disabled="false">Delete</button>`;
        }

        action += '</div>';

        return action;
    };

    /**
     * @param {string} uuid
     * @param {string[]} uuids
     * @returns {string}
     */
    const renderReadMore = (uuid, uuids) => {
        const hasId = showHide.get('show').includes(uuid);
        return `<a class="text-theme-auto" style="font-size: 0.8rem;" onclick="undangan.comment.showOrHide(this)" data-uuid="${uuid}" data-uuids="${uuids.join(',')}" data-show="${hasId ? 'true' : 'false'}" role="button" class="me-auto ms-1 py-0">${hasId ? 'Hide replies' : `Show replies (${uuids.length})`}</a>`;
    };

    /**
     * @param {ReturnType<typeof dto.getCommentResponse>} c
     * @returns {string}
     */
    const renderButton = (c) => {
        return `
        <div class="d-flex justify-content-between align-items-center" id="button-${c.uuid}">
            ${renderAction(c)}
            ${c.comments.length > 0 ? renderReadMore(c.uuid, c.comments.map((i) => i.uuid)) : ''}
            ${renderLike(c)}
        </div>`;
    };

    /**
     * @param {ReturnType<typeof dto.getCommentResponse>} c
     * @returns {string}
     */
    const renderTracker = (c) => {
        if (c.ip === undefined || c.user_agent === undefined || c.is_admin) {
            return '';
        }

        return `
        <div class="mb-1 mt-3">
            <p class="text-theme-auto mb-1 mx-0 mt-0 p-0" style="font-size: 0.7rem;" id="ip-${c.uuid}"><i class="fa-solid fa-location-dot me-1"></i>${util.escapeHtml(c.ip)} ${tracker.has(c.ip) ? `<strong>${tracker.get(c.ip)}</strong>` : `<span class="mb-1 placeholder col-2 rounded-3"></span>`}</p>
            <p class="text-theme-auto m-0 p-0" style="font-size: 0.7rem;"><i class="fa-solid fa-mobile-screen-button me-1"></i>${util.parseUserAgent(util.escapeHtml(c.user_agent))}</p>
        </div>`;
    };

    /**
     * @param {ReturnType<typeof dto.getCommentResponse>} c
     * @param {boolean} is_parent
     * @returns {string}
     */
    const renderHeader = (c, is_parent) => {
        if (is_parent) {
            return `class="bg-theme-auto shadow p-3 mx-0 mt-0 mb-3 rounded-4" data-parent="true"`;
        }

        return `class="${!showHide.get('hidden').find((i) => i.uuid === c.uuid)['show'] ? 'd-none' : ''} overflow-x-scroll mw-100 border-start bg-theme-auto py-2 ps-2 pe-0 my-2 ms-2 me-0"`;
    };

    /**
     * @param {ReturnType<typeof dto.getCommentResponse>} c
     * @param {boolean} is_parent
     * @returns {string}
     */
    const renderTitle = (c, is_parent) => {
        if (c.is_admin) {
            return `<strong class="me-1">${util.escapeHtml(user.get('name') ?? config.get('name'))}</strong><svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: -3px;" width="18" height="18" fill="#1d9bf0" viewBox="0 0 22 22"><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></svg>`;
        }

        if (is_parent) {
            return `<strong class="me-1">${util.escapeHtml(c.name)}</strong><i id="badge-${c.uuid}" class="fa-solid ${c.presence ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger'}"></i>`;
        }

        return `<strong>${util.escapeHtml(c.name)}</strong>`;
    };

    /**
     * @param {ReturnType<typeof dto.getCommentResponse>} c
     * @param {boolean} is_parent
     * @returns {string}
     */
    const renderBody = (c, is_parent) => {
        const original = convertMarkdownToHTML(util.escapeHtml(c.comment));
        const moreThanMaxLength = original.length > maxCommentLength;

        return `
        <div class="d-flex justify-content-between align-items-center">
            <p class="text-theme-auto text-truncate m-0 p-0" style="font-size: 0.95rem;">${renderTitle(c, is_parent)}</p>
            <small class="text-theme-auto m-0 p-0" style="font-size: 0.75rem;">${c.created_at}</small>
        </div>
        <hr class="my-1">
        <p class="text-theme-auto my-1 mx-0 p-0" style="white-space: pre-wrap !important; font-size: 0.95rem;" ${moreThanMaxLength ? `data-comment="${util.base64Encode(original)}"` : ''} id="content-${c.uuid}">${moreThanMaxLength ? (original.slice(0, maxCommentLength) + '...') : original}</p>
        ${moreThanMaxLength ? `<p class="mb-2 mt-0 mx-0 p-0"><a class="text-theme-auto" role="button" style="font-size: 0.85rem; display: block;" data-show="false" onclick="undangan.comment.showMore(this, '${c.uuid}')">Selengkapnya</a></p>` : ''}`;
    };

    /**
     * @param {ReturnType<typeof dto.getCommentResponse>} c
     * @param {boolean} is_parent
     * @returns {string}
     */
    const renderContent = (c, is_parent) => {
        return `
        <div ${renderHeader(c, is_parent)} id="${c.uuid}" style="overflow-wrap: break-word !important;">
            <div id="body-content-${c.uuid}" data-tapTime="0" data-liked="false" tabindex="0">
                ${renderBody(c, is_parent)}
            </div>
            ${renderTracker(c)}
            ${renderButton(c)}
            <div id="reply-content-${c.uuid}">${c.comments.map((i) => renderContent(i, false)).join('')}</div>
        </div>`;
    };

    /**
     * @param {string} id 
     * @returns {HTMLDivElement}
     */
    const renderReply = (id) => {
        const inner = document.createElement('div');
        inner.classList.add('my-2');
        inner.id = `inner-${id}`;
        inner.innerHTML = `
        <label for="form-inner-${id}" class="form-label my-1" style="font-size: 0.95rem;"><i class="fa-solid fa-reply me-2"></i>Reply</label>
        <textarea class="form-control shadow-sm rounded-4 mb-2" id="form-inner-${id}" minlength="1" maxlength="1000" placeholder="Type reply comment" rows="3" data-offline-disabled="false"></textarea>
        <div class="d-flex justify-content-end align-items-center mb-0">
            <button style="font-size: 0.8rem;" onclick="undangan.comment.cancel('${id}')" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1" data-offline-disabled="false">Cancel</button>
            <button style="font-size: 0.8rem;" onclick="undangan.comment.send(this)" data-uuid="${id}" class="btn btn-sm btn-outline-auto rounded-4 py-0" data-offline-disabled="false">Send</button>
        </div>`;

        return inner;
    };

    /**
     * @param {string} id 
     * @param {boolean} presence 
     * @param {boolean} is_parent 
     * @returns {HTMLDivElement}
     */
    const renderEdit = (id, presence, is_parent) => {
        const inner = document.createElement('div');
        inner.classList.add('my-2');
        inner.id = `inner-${id}`;
        inner.innerHTML = `
        <label for="form-inner-${id}" class="form-label my-1" style="font-size: 0.95rem;"><i class="fa-solid fa-pen me-2"></i>Edit</label>
        ${!is_parent ? '' : `
        <select class="form-select shadow-sm mb-2 rounded-4" id="form-inner-presence-${id}" data-offline-disabled="false">
            <option value="1" ${presence ? 'selected' : ''}>Datang</option>
            <option value="2" ${presence ? '' : 'selected'}>Berhalangan</option>
        </select>`}
        <textarea class="form-control shadow-sm rounded-4 mb-2" id="form-inner-${id}" minlength="1" maxlength="1000" placeholder="Type update comment" rows="3" data-offline-disabled="false"></textarea>
        <div class="d-flex justify-content-end align-items-center mb-0">
            <button style="font-size: 0.8rem;" onclick="undangan.comment.cancel('${id}')" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1" data-offline-disabled="false">Cancel</button>
            <button style="font-size: 0.8rem;" onclick="undangan.comment.update(this)" data-uuid="${id}" class="btn btn-sm btn-outline-auto rounded-4 py-0" data-offline-disabled="false">Update</button>
        </div>`;

        return inner;
    };

    /**
     * @returns {void}
     */
    const init = () => {
        user = storage('user');
        owns = storage('owns');
        likes = storage('likes');
        config = storage('config');
        tracker = storage('tracker');
        showHide = storage('comment');
    };

    return {
        init,
        renderEdit,
        renderReply,
        renderLoading,
        renderReadMore,
        renderInnerContent: (c) => renderContent(c, false),
        renderContent: (c) => renderContent(c, true),
        convertMarkdownToHTML,
        maxCommentLength,
    };
})();