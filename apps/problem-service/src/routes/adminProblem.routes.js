const express = require('express');
const controller = require('../controllers/adminProblem.controller');
const testCaseController = require('../controllers/testCase.controller');
const authenticate = require('../middlewares/auth.middleware');
const requireAdmin = require('../middlewares/requireAdmin.middleware');
const validate = require('../middlewares/validate.middleware');
const { problemCreateSchema, problemUpdateSchema, listProblemsQuerySchema } = require('../validators/problem.validator');
const { replaceTestCasesSchema } = require('../validators/testCase.validator');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.post('/', validate(problemCreateSchema), controller.create);
router.get('/', validate(listProblemsQuerySchema, 'query'), controller.list);
router.get('/:id', controller.getById);
router.patch('/:id', validate(problemUpdateSchema), controller.update);
router.delete('/:id', controller.remove);

// Hidden test cases. Inherits the authenticate + requireAdmin above, so these
// are ADMIN-only exactly like the rest of this router.
router.get('/:id/test-cases', testCaseController.list);
router.put('/:id/test-cases', validate(replaceTestCasesSchema), testCaseController.replace);

module.exports = router;
