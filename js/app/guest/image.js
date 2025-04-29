import { progress } from './progress.js';
import { util } from '../../common/util.js';

export const image = (() => {

    /**
     * @type {Map<string, string>|null}
     */
    let uniqUrl = null;

    /**
     * @type {NodeListOf<HTMLImageElement>|null}
     */
    let images = null;

    let hasSrc = false;

    // default 6 hour TTL
    let ttl = 1000 * 60 * 60 * 6;

    const cacheName = 'images';

    /**
     * @param {HTMLImageElement} el 
     * @returns {Promise<void>}
     */
    const getByFetch = async (el) => {
        const url = el.getAttribute('data-src');
        const exp = 'x-expiration-time';
        const type = 'image/webp';
        const img = new Image();

        img.onload = () => {
            el.src = img.src;
            el.width = img.width;
            el.height = img.height;
            img.remove();
            progress.complete('image');
        };

        if (uniqUrl.has(url)) {
            img.src = uniqUrl.get(url);
            return;
        }

        /**
         * @param {ImageBitmap} i
         * @returns {Promise<Blob>}
         */
        const toWebp = (i) => new Promise((res, rej) => {
            const c = document.createElement('canvas');
            c.width = i.width;
            c.height = i.height;
            c.getContext('2d').drawImage(i, 0, 0);

            const callback = (b) => {
                c.remove();

                if (b) {
                    res(b);
                } else {
                    rej(new Error('Failed to convert image to WebP'));
                }
            };

            c.onerror = rej;
            c.toBlob(callback, type, 0.8);
        });

        /**
         * @param {Cache} c 
         * @param {number} retries
         * @param {number} delay
         * @returns {Promise<Blob>}
         */
        const fetchPut = (c, retries = 3, delay = 1000) => fetch(url)
            .then((r) => r.blob())
            .then((b) => window.createImageBitmap(b))
            .then((i) => toWebp(i))
            .then((b) => {
                const headers = new Headers();
                headers.set('Content-Type', type);
                headers.set('Content-Length', String(b.size));
                headers.set(exp, String(Date.now() + ttl));

                return c.put(url, new Response(b, { headers })).then(() => b);
            })
            .catch((err) => {
                if (retries <= 0) {
                    throw err;
                }

                console.warn('Retrying fetch:' + url);
                return new Promise((res) => util.timeOut(() => res(fetchPut(c, retries - 1, delay + 1000)), delay));
            });

        /**
         * @param {Cache} c 
         * @returns {Promise<Blob>}
         */
        const imageCache = (c) => c.match(url).then((res) => {
            if (!res) {
                return fetchPut(c);
            }

            if (Date.now() <= parseInt(res.headers.get(exp))) {
                return res.blob();
            }

            return c.delete(url).then((s) => s ? fetchPut(c) : res.blob());
        });

        await caches.open(cacheName)
            .then((c) => imageCache(c))
            .then((b) => {
                img.src = URL.createObjectURL(b);
                uniqUrl.set(url, img.src);
            })
            .catch(() => progress.invalid('image'));
    };

    /**
     * @param {HTMLImageElement} el 
     * @returns {void}
     */
    const getByDefault = (el) => {
        el.onerror = () => progress.invalid('image');
        el.onload = () => {
            el.width = el.naturalWidth;
            el.height = el.naturalHeight;
            progress.complete('image');
        };

        if (el.complete && el.naturalWidth !== 0 && el.naturalHeight !== 0) {
            progress.complete('image');
        } else if (el.complete) {
            progress.invalid('image');
        }
    };

    /**
     * @returns {boolean}
     */
    const hasDataSrc = () => hasSrc;

    /**
     * @param {number} v
     * @returns {void} 
     */
    const setTtl = (v) => {
        ttl = Number(v);
    };

    /**
     * @returns {void}
     */
    const load = () => {
        (async () => {
            for (const el of images) {
                if (el.hasAttribute('data-src')) {
                    await getByFetch(el);
                } else {
                    getByDefault(el);
                }
            }
        })();
    };

    /**
     * @returns {object}
     */
    const init = () => {
        uniqUrl = new Map();
        images = document.querySelectorAll('img');

        images.forEach(progress.add);
        hasSrc = Array.from(images).some((i) => i.hasAttribute('data-src'));

        return {
            load,
            setTtl,
            hasDataSrc,
        };
    };

    return {
        init,
    };
})();