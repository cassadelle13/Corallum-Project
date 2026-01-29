export interface ApplicationConfig {
    port: number;
    database: any;
    jwt: {
        secret: string;
    };
    redis?: any;
    ai?: any;
    inngest?: any;
}
export declare class Application {
    private app;
    private config;
    private database;
    private enterprise;
    private ai;
    private reliability;
    constructor(config: ApplicationConfig);
    private initializeServices;
    private setupMiddleware;
    private setupRoutes;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=Application.d.ts.map