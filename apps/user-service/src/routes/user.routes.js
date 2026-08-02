const express = require('express');
const { getMe, updateMe, getPublicProfile } = require('../controllers/user.controller');
const validate = require('../middlewares/validate.middleware');
const authenticate = require('../middlewares/auth.middleware');
const { updateProfileSchema } = require('../validators/user.validator');

const router = express.Router();

// /me routes must be registered before the /:username wildcard, otherwise
// Express would match "me" as a username for the wildcard route instead.
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validate(updateProfileSchema), updateMe);
router.get('/:username', getPublicProfile);

module.exports = router;
