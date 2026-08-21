const ApiError = require('../utils/ApiError');

// No precedent in User Service (none of its routes are role-gated) — this is
// new, not copied from an established convention. Must run after
// auth.middleware.js so req.user is already set.
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return next(new ApiError(403, 'Forbidden'));
  }

  return next();
}

module.exports = requireAdmin;
