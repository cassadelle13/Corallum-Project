import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

type Schemas = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body) as any;
      }
      next();
    } catch (err: any) {
      return res.status(400).json({
        error: 'Validation error',
        details: err?.errors || err?.message || String(err)
      });
    }
  };
}
