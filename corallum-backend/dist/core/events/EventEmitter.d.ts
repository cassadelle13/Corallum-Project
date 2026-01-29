export interface EventListener {
    (event: string, data?: any): void;
}
export interface EventData {
    [key: string]: any;
}
export declare class SimpleEventEmitter {
    private listeners;
    on(event: string, listener: EventListener): void;
    off(event: string, listener: EventListener): void;
    emit(event: string, data?: any): void;
    removeAllListeners(event?: string): void;
}
//# sourceMappingURL=EventEmitter.d.ts.map