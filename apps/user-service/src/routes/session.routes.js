const express = require('express');
const { getSessions, deleteSession, deleteAllOtherSessions } = require('../controllers/session.controller');
const authenticate = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', getSessions);
router.delete('/:id', deleteSession);
router.delete('/', deleteAllOtherSessions);

module.exports = router;
