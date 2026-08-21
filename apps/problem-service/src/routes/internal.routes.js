const express = require('express');
const controller = require('../controllers/internal.controller');
const internalAuth = require('../middlewares/internalAuth.middleware');

const router = express.Router();

// Shared-secret only — no authenticate/requireAdmin here, and equally no way
// in without the secret. Applied with router.use so every route added under
// /internal in future is covered by default rather than by remembering to
// attach the middleware.
router.use(internalAuth);

router.get('/problems/:id/test-cases', controller.getTestCases);

module.exports = router;
