const testCaseService = require('../services/testCase.service');

async function list(req, res, next) {
  try {
    const testCases = await testCaseService.listForProblem(req.params.id);

    res.status(200).json({
      success: true,
      data: { testCases },
    });
  } catch (err) {
    next(err);
  }
}

async function replace(req, res, next) {
  try {
    const testCases = await testCaseService.replaceForProblem(req.params.id, req.body.testCases);

    res.status(200).json({
      success: true,
      message: 'Test cases replaced',
      data: { testCases },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  replace,
};
