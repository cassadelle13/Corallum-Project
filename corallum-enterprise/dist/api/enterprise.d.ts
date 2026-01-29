import type { EnterpriseManager } from '../enterprise/EnterpriseManager';
declare global {
    namespace Express {
        interface Request {
            tenant?: {
                id: string;
                name: string;
                slug: string;
                settings: any;
                is_active: boolean;
            };
        }
    }
}
export default function createEnterpriseRouter(enterprise: EnterpriseManager): import("express-serve-static-core").Router;
//# sourceMappingURL=enterprise.d.ts.map