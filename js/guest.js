import { guest } from './app/guest/guest.js';

((w) => {
    w.undangan = guest.init();
})(window);