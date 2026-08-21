const problemService = require('../services/problem.service');

async function create(req, res, next) {
  try {
    const problem = await problemService.createProblem(req.body);

    res.status(201).json({
      success: true,
      message: 'Problem created',
      data: { problem },
    });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await problemService.listAdmin(req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const problem = await problemService.getById(req.params.id);

    res.status(200).json({
      success: true,
      data: { problem },
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const problem = await problemService.updateProblem(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Problem updated',
      data: { problem },
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await problemService.deleteProblem(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Problem deleted',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
};
