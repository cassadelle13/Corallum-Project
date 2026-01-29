"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleEventEmitter = void 0;
class SimpleEventEmitter {
    constructor() {
        this.listeners = new Map();
    }
    on(event, listener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(listener);
    }
    off(event, listener) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    emit(event, data) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(event, data);
                }
                catch (error) {
                    // Silent error handling
                }
            });
        }
    }
    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
        }
    }
}
exports.SimpleEventEmitter = SimpleEventEmitter;
//# sourceMappingURL=EventEmitter.js.map