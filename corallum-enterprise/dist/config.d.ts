export declare const config: {
    port: number;
    nodeEnv: string;
    database: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
        min: number;
        max: number;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    redis: {
        host: string;
        port: number;
        password: string;
    };
    ai: {
        openaiApiKey: string;
        ollamaUrl: string;
        defaultModel: string;
    };
    inngest: {
        apiKey: string;
        baseUrl: string;
        eventKey: string;
        signingKey: string;
    };
    cors: {
        origins: string[];
        credentials: boolean;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
};
//# sourceMappingURL=config.d.ts.map