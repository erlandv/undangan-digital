import { dto } from '../../connection/dto.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';
import { tapTapAnimation } from '../../libs/confetti.js';
import { request, HTTP_PATCH, HTTP_POST, HTTP_STATUS_CREATED } from '../../connection/request.js';

export const like = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let likes = null;

    /**
     * @param {HTMLButtonElement} button
     * @returns {Promise<void>}
     */
    const love = async (button) => {

        const info = button.firstElementChild;
        const heart = button.lastElementChild;

        const id = button.getAttribute('data-uuid');
        const count = parseInt(info.getAttribute('data-count-like'));

        button.disabled = true;

        if (likes.has(id)) {
            await request(HTTP_PATCH, '/api/comment/' + likes.get(id))
                .token(session.getToken())
                .send(dto.statusResponse)
                .then((res) => {
                    if (res.data.status) {
                        likes.unset(id);

                        heart.classList.remove('fa-solid', 'text-danger');
                        heart.classList.add('fa-regular');

                        info.setAttribute('data-count-like', String(count - 1));
                    }
                });
        } else {
            await request(HTTP_POST, '/api/comment/' + id)
                .token(session.getToken())
                .send(dto.uuidResponse)
                .then((res) => {
                    if (res.code === HTTP_STATUS_CREATED) {
                        likes.set(id, res.data.uuid);

                        heart.classList.remove('fa-regular');
                        heart.classList.add('fa-solid', 'text-danger');

                        info.setAttribute('data-count-like', String(count + 1));
                    }
                });
        }

        info.innerText = info.getAttribute('data-count-like');
        button.disabled = false;
    };

    /**
     * @param {HTMLElement} div
     * @returns {Promise<void>}
     */
    const tapTap = async (div) => {
        if (!navigator.onLine) {
            return;
        }

        const currentTime = Date.now();
        const tapLength = currentTime - parseInt(div.getAttribute('data-tapTime'));
        const uuid = div.id.replace('body-content-', '');

        const isTapTap = tapLength < 300 && tapLength > 0;
        const notLiked = !likes.has(uuid) && div.getAttribute('data-liked') !== 'true';

        if (isTapTap && notLiked) {
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }

            tapTapAnimation(div);
            const likeButton = document.querySelector(`[onclick="undangan.comment.like.love(this)"][data-uuid="${uuid}"]`);

            div.setAttribute('data-liked', 'true');
            await love(likeButton);
            div.setAttribute('data-liked', 'false');
        }

        div.setAttribute('data-tapTime', currentTime);
    };

    /**
     * @returns {void}
     */
    const init = () => {
        likes = storage('likes');
    };

    return {
        init,
        love,
        tapTap,
    };
})();