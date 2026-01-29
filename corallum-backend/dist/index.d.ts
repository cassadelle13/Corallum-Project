declare class CorallumServer {
    private routes;
    constructor();
    getPort(): number;
    handleRequest(req: any, res: any): Promise<void>;
    private parseParams;
    start(port?: number): Promise<void>;
    private shutdown;
}
export default CorallumServer;
//# sourceMappingURL=index.d.ts.map