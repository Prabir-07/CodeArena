const express = require('express');
const controller = require('../controllers/problem.controller');
const validate = require('../middlewares/validate.middleware');
const { listProblemsQuerySchema } = require('../validators/problem.validator');

const router = express.Router();

// Public catalog — no authenticate/requireAdmin here, deliberately. These are
// the only Problem Service routes that are reachable without a token.
//
// :slug is not format-validated: a malformed slug simply matches no published
// row and falls through to the same 404 as an unknown one, which matches how
// User Service's GET /users/:username behaves.
router.get('/problems', validate(listProblemsQuerySchema, 'query'), controller.list);
router.get('/problems/:slug', controller.getBySlug);
router.get('/tags', controller.listTags);

module.exports = router;
