"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
function validate(schemas) {
    return (req, res, next) => {
        try {
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            next();
        }
        catch (err) {
            return res.status(400).json({
                error: 'Validation error',
                details: err?.errors || err?.message || String(err)
            });
        }
    };
}
//# sourceMappingURL=validate.js.map