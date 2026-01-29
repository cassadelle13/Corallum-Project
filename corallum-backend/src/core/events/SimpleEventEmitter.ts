// Простая реализация EventEmitter без внешних зависимостей
export interface EventListener {
    (event: string, data?: any): void;
}

export class SimpleEventEmitter {
    private listeners: Map<string, EventListener[]> = new Map();
    
    on(event: string, listener: EventListener): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(listener);
    }
    
    off(event: string, listener: EventListener): void {
        const listeners = this.listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    emit(event: string, data?: any): void {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(event, data);
                } catch (error) {
                    // Silent error handling
                }
            });
        }
    }
    
    removeAllListeners(event?: string): void {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}
