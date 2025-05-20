const testService = require("../services/test.service");

const getTests = async (req, res) => {
  try {
    const { language } = req.body;
    const tests = await testService.getTests({ language });
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({
      error: error.message || "Lỗi máy chủ khi lấy danh sách bài thi.",
    });
  }
};

const getTestQuestion = async (req, res) => {
  try {
    const { testId, userId } = req.body;
    const response = await testService.getTestQuestion({ testId, userId });
    res.status(200).json(response);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Lỗi khi lấy câu hỏi bài thi." });
  }
};

const submitAnswer = async (req, res) => {
  try {
    const { testResultId, questionId, selectedAnswer } = req.body;
    await testService.submitAnswer({
      testResultId,
      questionId,
      selectedAnswer,
    });
    res.status(200).json({ message: "Submit thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message || "Lỗi khi nộp đáp án." });
  }
};

const submitTest = async (req, res) => {
  try {
    const { testResultId } = req.body;
    await testService.submitTest({ testResultId });
    res.status(200).json({ message: "Submit thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message || "Lỗi khi nộp bài thi." });
  }
};

const getTestResult = async (req, res) => {
  try {
    const { testResultId } = req.body;
    const testResult = await testService.getTestResult({ testResultId });
    res.status(200).json(testResult);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Lỗi khi lấy kết quả bài thi." });
  }
};

const getTestHistory = async (req, res) => {
  try {
    const { userId, testId } = req.body;
    const testResults = await testService.getTestHistory({ userId, testId });
    res.status(200).json(testResults);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Lỗi khi lấy lịch sử bài thi." });
  }
};
module.exports = {
  getTests,
  getTestQuestion,
  submitAnswer,
  getTestResult,
  submitTest,
  getTestHistory,
};
