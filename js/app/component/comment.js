import { card } from './card.js';
import { like } from './like.js';
import { util } from '../../common/util.js';
import { pagination } from './pagination.js';
import { dto } from '../../connection/dto.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';
import { request, HTTP_GET, HTTP_POST, HTTP_DELETE, HTTP_PUT, HTTP_STATUS_OK, HTTP_STATUS_CREATED } from '../../connection/request.js';

export const comment = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let owns = null;

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let user = null;

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let tracker = null;

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let showHide = null;

    /**
     * @returns {string}
     */
    const onNullComment = () => {
        return `<div class="text-center p-4 my-2 bg-theme-auto rounded-4 shadow"><p class="fw-bold p-0 m-0" style="font-size: 0.95rem;">Jadilah yang pertama memberikan ucapan untuk kedua mempelai!</p></div>`;
    };

    /**
     * @param {string} id 
     * @param {boolean} disabled 
     * @returns {void}
     */
    const changeButton = (id, disabled) => {
        document.querySelector(`[data-button-action="${id}"]`).childNodes.forEach((e) => {
            e.disabled = disabled;
        });
    };

    /**
     * @returns {void}
     */
    const scroll = () => document.getElementById('comments').scrollIntoView({ behavior: 'smooth' });

    /**
     * @param {ReturnType<typeof dto.getCommentResponse>} c
     * @returns {void}
     */
    const addListenerLike = (c) => {
        if (c.comments) {
            c.comments.forEach(addListenerLike);
        }

        const bodyLike = document.getElementById(`body-content-${c.uuid}`);
        bodyLike.addEventListener('touchend', () => like.tapTap(bodyLike));
    };

    /**
     * @param {HTMLButtonElement} button 
     * @returns {Promise<void>}
     */
    const remove = async (button) => {
        if (!confirm('Are you sure?')) {
            return;
        }

        const id = button.getAttribute('data-uuid');

        if (session.isAdmin()) {
            owns.set(id, button.getAttribute('data-own'));
        }

        changeButton(id, true);
        const btn = util.disableButton(button);
        const likes = document.querySelector(`[onclick="undangan.comment.like.love(this)"][data-uuid="${id}"]`);
        likes.disabled = true;

        const status = await request(HTTP_DELETE, '/api/comment/' + owns.get(id))
            .token(session.getToken())
            .send(dto.statusResponse)
            .then((res) => res.data.status, () => false);

        if (!status) {
            btn.restore();
            likes.disabled = false;
            return;
        }

        document.querySelectorAll('a[onclick="undangan.comment.showOrHide(this)"]').forEach((n) => {
            const oldUuids = n.getAttribute('data-uuids').split(',');

            if (oldUuids.find((i) => i === id)) {
                const uuids = oldUuids.filter((i) => i !== id).join(',');
                uuids.length === 0 ? n.remove() : n.setAttribute('data-uuids', uuids);
            }
        });

        owns.unset(id);
        document.getElementById(id).remove();

        const comments = document.getElementById('comments');
        if (comments.children.length === 0) {
            comments.innerHTML = onNullComment();
        }
    };

    /**
     * @param {HTMLButtonElement} button 
     * @returns {Promise<void>}
     */
    const update = async (button) => {
        const id = button.getAttribute('data-uuid');

        let isPresent = false;
        const presence = document.getElementById(`form-inner-presence-${id}`);
        if (presence) {
            presence.disabled = true;
            isPresent = presence.value === '1';
        }

        const form = document.getElementById(`form-${id ? `inner-${id}` : 'comment'}`);

        let isChecklist = false;
        const badge = document.getElementById(`badge-${id}`);
        if (badge) {
            isChecklist = badge.classList.contains('text-success');
        }

        if (id && util.base64Encode(form.value) === form.getAttribute('data-original') && isChecklist === isPresent) {
            changeButton(id, false);
            document.getElementById(`inner-${id}`).remove();
            return;
        }

        form.disabled = true;

        const cancel = document.querySelector(`[onclick="undangan.comment.cancel('${id}')"]`);
        if (cancel) {
            cancel.disabled = true;
        }

        const btn = util.disableButton(button);

        const status = await request(HTTP_PUT, '/api/comment/' + owns.get(id))
            .token(session.getToken())
            .body(dto.updateCommentRequest(presence ? isPresent : null, form.value))
            .send(dto.statusResponse)
            .then((res) => res.data.status, () => false);

        form.disabled = false;
        if (cancel) {
            cancel.disabled = false;
        }

        if (presence) {
            presence.disabled = false;
        }

        btn.restore();

        if (!status) {
            return;
        }

        changeButton(id, false);
        document.getElementById(`inner-${id}`).remove();

        const show = document.querySelector(`[onclick="undangan.comment.showMore(this, '${id}')"]`);
        const original = card.convertMarkdownToHTML(util.escapeHtml(form.value));
        const content = document.getElementById(`content-${id}`);

        if (original.length > card.maxCommentLength) {
            content.innerHTML = show?.getAttribute('data-show') === 'false' ? original.slice(0, card.maxCommentLength) + '...' : original;
            content.setAttribute('data-comment', util.base64Encode(original));
            if (show?.style.display === 'none') {
                show.style.display = 'block';
            }
        } else {
            content.innerHTML = original;
            content.removeAttribute('data-comment');
            if (show?.style.display === 'block') {
                show.style.display = 'none';
            }
        }

        if (presence) {
            document.getElementById('form-presence').value = isPresent ? '1' : '2';
            storage('information').set('presence', isPresent);
        }

        if (!presence || !badge) {
            return;
        }

        if (isPresent) {
            badge.classList.remove('fa-circle-xmark', 'text-danger');
            badge.classList.add('fa-circle-check', 'text-success');
            return;
        }

        badge.classList.remove('fa-circle-check', 'text-success');
        badge.classList.add('fa-circle-xmark', 'text-danger');
    };

    /**
     * @param {HTMLButtonElement} button 
     * @returns {Promise<void>}
     */
    const send = async (button) => {
        const id = button.getAttribute('data-uuid');

        const name = document.getElementById('form-name');
        let nameValue = name.value;

        if (session.isAdmin()) {
            nameValue = user.get('name');
        }

        if (nameValue.length === 0) {
            if (id) {
                // scroll to form.
                document.getElementById('comment').scrollIntoView({ behavior: 'smooth' });
            }

            alert('Name cannot be empty.');
            return;
        }

        const presence = document.getElementById('form-presence');
        if (!id && presence && presence.value === '0') {
            alert('Please select your attendance status.');
            return;
        }

        const form = document.getElementById(`form-${id ? `inner-${id}` : 'comment'}`);
        if (form.value.length === 0) {
            alert('Comments cannot be empty.');
            return;
        }

        if (!id && name && !session.isAdmin()) {
            name.disabled = true;
        }

        if (presence && presence.value !== '0') {
            presence.disabled = true;
        }

        form.disabled = true;

        const cancel = document.querySelector(`[onclick="undangan.comment.cancel('${id}')"]`);
        if (cancel) {
            cancel.disabled = true;
        }

        const btn = util.disableButton(button);
        const isPresence = presence ? presence.value === '1' : true;

        if (!session.isAdmin()) {
            const info = storage('information');
            info.set('name', nameValue);

            if (!id) {
                info.set('presence', isPresence);
            }
        }

        const response = await request(HTTP_POST, '/api/comment')
            .token(session.getToken())
            .body(dto.postCommentRequest(id, nameValue, isPresence, form.value))
            .send(dto.getCommentResponse)
            .then((res) => res, () => null);

        if (name) {
            name.disabled = false;
        }

        form.disabled = false;
        if (cancel) {
            cancel.disabled = false;
        }

        if (presence) {
            presence.disabled = false;
        }

        btn.restore();

        if (!response || response.code !== HTTP_STATUS_CREATED) {
            return;
        }

        owns.set(response.data.uuid, response.data.own);
        form.value = null;

        if (!id) {
            const newPage = await pagination.reset();
            if (newPage) {
                scroll();
                return;
            }

            const c = document.getElementById('comments');
            pagination.setResultData(c.children.length);

            if (pagination.getResultData() === pagination.getPer()) {
                c.lastElementChild.remove();
            }

            response.data.is_admin = session.isAdmin();
            c.innerHTML = card.renderContent(response.data) + c.innerHTML;
            scroll();
        }

        if (id) {
            showHide.set('hidden', showHide.get('hidden').concat([dto.commentShowMore(response.data.uuid, true)]));
            showHide.set('show', showHide.get('show').concat([id]));

            changeButton(id, false);
            document.getElementById(`inner-${id}`).remove();

            response.data.is_admin = session.isAdmin();
            document.getElementById(`reply-content-${id}`).insertAdjacentHTML('beforeend', card.renderInnerContent(response.data));

            const containerDiv = document.getElementById(`button-${id}`);
            const anchorTag = containerDiv.querySelector('a');
            const uuids = [response.data.uuid];

            if (anchorTag) {
                if (anchorTag.getAttribute('data-show') === 'false') {
                    showOrHide(anchorTag);
                }

                anchorTag.remove();
            }

            containerDiv.querySelector(`button[onclick="undangan.comment.like.love(this)"][data-uuid="${id}"]`)
                .insertAdjacentHTML('beforebegin', card.renderReadMore(id, anchorTag ? anchorTag.getAttribute('data-uuids').split(',').concat(uuids) : uuids));
        }

        addListenerLike(response.data);
    };

    /**
     * @param {string} id
     * @returns {void}
     */
    const cancel = (id) => {
        const form = document.getElementById(`form-inner-${id}`);

        let isPresent = false;
        const presence = document.getElementById(`form-inner-presence-${id}`);
        if (presence) {
            isPresent = presence.value === '1';
        }

        let isChecklist = false;
        const badge = document.getElementById(`badge-${id}`);
        if (badge) {
            isChecklist = badge.classList.contains('text-success');
        }

        if (form.value.length === 0 || (util.base64Encode(form.value) === form.getAttribute('data-original') && isChecklist === isPresent) || confirm('Are you sure?')) {
            changeButton(id, false);
            document.getElementById(`inner-${id}`).remove();
        }
    };

    /**
     * @param {HTMLButtonElement} button 
     * @returns {void}
     */
    const reply = (button) => {
        const id = button.getAttribute('data-uuid');

        if (document.getElementById(`inner-${id}`)) {
            return;
        }

        changeButton(id, true);
        document.getElementById(`button-${id}`).insertAdjacentElement('afterend', card.renderReply(id));
    };

    /**
     * @param {HTMLButtonElement} button 
     * @returns {Promise<void>}
     */
    const edit = async (button) => {
        const id = button.getAttribute('data-uuid');

        if (document.getElementById(`inner-${id}`)) {
            return;
        }

        changeButton(id, true);
        const btn = util.disableButton(button);

        await request(HTTP_GET, '/api/comment/' + id)
            .token(session.getToken())
            .send(dto.commentResponse)
            .then((res) => {
                if (res.code !== HTTP_STATUS_OK) {
                    return;
                }

                const IsParent = document.getElementById(id).getAttribute('data-parent') === 'true' && !session.isAdmin();
                document.getElementById(`button-${id}`).insertAdjacentElement('afterend', card.renderEdit(id, res.data.presence, IsParent));
                const formInner = document.getElementById(`form-inner-${id}`);
                formInner.value = res.data.comment;
                formInner.setAttribute('data-original', util.base64Encode(res.data.comment));
            });

        btn.restore();
        button.disabled = true;
    };

    /**
     * @param {ReturnType<typeof dto.getCommentsResponse>} items 
     * @param {ReturnType<typeof dto.commentShowMore>[]} hide 
     * @returns {ReturnType<typeof dto.commentShowMore>[]}
     */
    const traverse = (items, hide) => {
        items.forEach((item) => {
            if (!hide.find((i) => i.uuid === item.uuid)) {
                hide.push(dto.commentShowMore(item.uuid));
            }

            if (item.comments && item.comments.length > 0) {
                traverse(item.comments, hide);
            }
        });

        return hide;
    };

    /**
     * @returns {Promise<ReturnType<typeof dto.getCommentsResponse>>}
     */
    const show = () => {
        const c = document.getElementById('comments');

        if (c.getAttribute('data-loading') === 'false') {
            c.setAttribute('data-loading', 'true');
            c.innerHTML = card.renderLoading().repeat(pagination.getPer());
        }

        return request(HTTP_GET, `/api/comment?per=${pagination.getPer()}&next=${pagination.getNext()}`)
            .token(session.getToken())
            .send(dto.getCommentsResponse)
            .then((res) => {
                pagination.setResultData(res.data.length);
                c.setAttribute('data-loading', 'false');

                if (res.data.length === 0) {
                    c.innerHTML = onNullComment();
                    return res;
                }

                showHide.set('hidden', traverse(res.data, showHide.get('hidden')));
                c.innerHTML = res.data.map((i) => card.renderContent(i)).join('');

                res.data.forEach(fetchTracker);
                res.data.forEach(addListenerLike);

                return res;
            });
    };

    /**
     * @param {HTMLButtonElement} button 
     * @returns {void}
     */
    const showOrHide = (button) => {
        const ids = button.getAttribute('data-uuids').split(',');
        const isShow = button.getAttribute('data-show') === 'true';
        const uuid = button.getAttribute('data-uuid');

        if (isShow) {
            button.setAttribute('data-show', 'false');
            button.innerText = 'Show replies';
            button.innerText += ' (' + ids.length + ')';

            showHide.set('show', showHide.get('show').filter((i) => i !== uuid));
        } else {
            button.setAttribute('data-show', 'true');
            button.innerText = 'Hide replies';

            showHide.set('show', showHide.get('show').concat([uuid]));
        }

        for (const id of ids) {
            showHide.set('hidden', showHide.get('hidden').map((i) => {
                if (i.uuid === id) {
                    i.show = !isShow;
                }

                return i;
            }));

            const cls = document.getElementById(id).classList;
            isShow ? cls.add('d-none') : cls.remove('d-none');
        }
    };

    /**
     * @param {HTMLAnchorElement} anchor 
     * @param {string} uuid 
     * @returns {void}
     */
    const showMore = (anchor, uuid) => {
        const c = document.getElementById(`content-${uuid}`);
        const original = util.base64Decode(c.getAttribute('data-comment'));
        const isCollapsed = anchor.getAttribute('data-show') === 'false';

        c.innerHTML = isCollapsed ? original : original.slice(0, card.maxCommentLength) + '...';
        anchor.innerText = isCollapsed ? 'Sebagian' : 'Selengkapnya';
        anchor.setAttribute('data-show', isCollapsed ? 'true' : 'false');
    };

    /**
     * @param {ReturnType<typeof dto.getCommentResponse>} c
     * @returns {void}
     */
    const fetchTracker = (c) => {
        if (!session.isAdmin()) {
            return;
        }

        if (c.comments) {
            c.comments.forEach(fetchTracker);
        }

        if (c.ip === undefined || c.user_agent === undefined || c.is_admin || tracker.has(c.ip)) {
            return;
        }

        fetch(`https://api.erland.me/ipapi.php?ip=${c.ip}`)
            .then((res) => res.json())
            .then((res) => {
                console.log('API Response:', res);
                
                let result = res.cityName + ' - ' + res.regionName;

                if (res.cityName === '-' && res.regionName === '-') {
                    result = 'localhost';
                }

                tracker.set(c.ip, result);
                document.getElementById(`ip-${c.uuid}`).innerHTML = `<i class="fa-solid fa-location-dot me-1"></i>${util.escapeHtml(c.ip)} <strong>${result}</strong>`;
            })
            .catch((err) => {
                console.error('Failed to fetch IP info:', err);
                document.getElementById(`ip-${c.uuid}`).innerHTML = `<i class="fa-solid fa-location-dot me-1"></i>${util.escapeHtml(c.ip)} <strong>${util.escapeHtml(err.message)}</strong>`;
            });
    };

    /**
     * @returns {void}
     */
    const init = () => {
        like.init();
        card.init();
        pagination.init();

        owns = storage('owns');
        user = storage('user');
        tracker = storage('tracker');
        showHide = storage('comment');

        if (!showHide.has('hidden')) {
            showHide.set('hidden', []);
        }

        if (!showHide.has('show')) {
            showHide.set('show', []);
        }
    };

    return {
        like,
        pagination,
        init,
        scroll,
        cancel,
        send,
        edit,
        reply,
        remove,
        update,
        show,
        showMore,
        showOrHide,
    };
})();