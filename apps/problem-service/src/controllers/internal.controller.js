const testCaseService = require('../services/testCase.service');

async function getTestCases(req, res, next) {
  try {
    const testCases = await testCaseService.listForJudge(req.params.id);

    res.status(200).json({
      success: true,
      data: { testCases },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTestCases,
};
