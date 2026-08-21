const express = require('express');
const controller = require('../controllers/adminProblem.controller');
const authenticate = require('../middlewares/auth.middleware');
const requireAdmin = require('../middlewares/requireAdmin.middleware');
const validate = require('../middlewares/validate.middleware');
const { problemCreateSchema, problemUpdateSchema, listProblemsQuerySchema } = require('../validators/problem.validator');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.post('/', validate(problemCreateSchema), controller.create);
router.get('/', validate(listProblemsQuerySchema, 'query'), controller.list);
router.get('/:id', controller.getById);
router.patch('/:id', validate(problemUpdateSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
