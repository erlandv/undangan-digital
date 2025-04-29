import { admin } from './app/admin/admin.js';

((w) => {
    w.undangan = admin.init();
})(window);