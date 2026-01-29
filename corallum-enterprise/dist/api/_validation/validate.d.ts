import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
type Schemas = {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
};
export declare function validate(schemas: Schemas): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export {};
//# sourceMappingURL=validate.d.ts.map