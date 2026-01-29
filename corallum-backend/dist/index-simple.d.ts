declare class SimpleHTTPServer {
    private routes;
    constructor();
    handleRequest(req: any, res: any): Promise<void>;
    start(port: number): void;
}
export default SimpleHTTPServer;
//# sourceMappingURL=index-simple.d.ts.map