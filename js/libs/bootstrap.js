export const bs = (() => {

    /**
     * @param {string} id
     * @returns {ReturnType<typeof bootstrap.Modal>}
     */
    const modal = (id) => {
        return window.bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
    };

    /**
     * @param {string} id
     * @returns {ReturnType<typeof bootstrap.Tab>}
     */
    const tab = (id) => {
        return window.bootstrap.Tab.getOrCreateInstance(document.getElementById(id));
    };

    return {
        tab,
        modal,
    };
})();