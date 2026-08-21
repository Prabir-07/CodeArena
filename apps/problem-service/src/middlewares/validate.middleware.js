const ApiError = require('../utils/ApiError');

// Same factory/error-formatting shape as
// apps/user-service/src/middlewares/validate.middleware.js, generalized with
// a `source` param so it can validate req.query (admin list filters) as well
// as req.body — User Service only ever validates bodies, so it had no need
// for this, but the shape/behavior for `body` is unchanged.
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      return next(new ApiError(400, message));
    }

    // Express 5 makes `req.query` a getter with no setter — a plain
    // `req.query = result.data` silently no-ops, leaving the next handler
    // with the raw, unvalidated (and un-defaulted) query object.
    // `req.body` has no such restriction, so this only matters for `query`.
    if (source === 'query') {
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req[source] = result.data;
    }
    return next();
  };
}

module.exports = validate;
