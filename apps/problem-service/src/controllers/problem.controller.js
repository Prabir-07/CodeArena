const problemService = require('../services/problem.service');

async function list(req, res, next) {
  try {
    const result = await problemService.listPublished(req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    const problem = await problemService.getPublishedBySlug(req.params.slug);

    res.status(200).json({
      success: true,
      data: { problem },
    });
  } catch (err) {
    next(err);
  }
}

async function listTags(req, res, next) {
  try {
    const tags = await problemService.listPublicTags();

    res.status(200).json({
      success: true,
      data: { tags },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getBySlug,
  listTags,
};
