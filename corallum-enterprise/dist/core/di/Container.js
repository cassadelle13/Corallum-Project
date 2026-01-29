"use strict";
// Dependency Injection Container
// Решает проблемы циклических зависимостей
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = exports.DIContainer = void 0;
class DIContainer {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
    }
    register(key, factory, singleton = false) {
        this.services.set(key, { factory, singleton });
    }
    get(key) {
        const service = this.services.get(key);
        if (!service) {
            throw new Error(`Service ${key} not found`);
        }
        if (service.singleton) {
            if (!this.singletons.has(key)) {
                this.singletons.set(key, service.factory());
            }
            return this.singletons.get(key);
        }
        return service.factory();
    }
    static getInstance() {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer();
        }
        return DIContainer.instance;
    }
}
exports.DIContainer = DIContainer;
// Глобальный контейнер
exports.container = DIContainer.getInstance();
//# sourceMappingURL=Container.js.map