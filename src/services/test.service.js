const _ = require("lodash");
const Test = require("../models/test.model");
const Question = require("../models/question.model");
const TestResult = require("../models/testResult.model");

const getTests = async ({ language }) => {
  if (!language) {
    const tests = await Test.find({ classId: { $exists: false } });
    return tests;
  } else {
    const tests = await Test.find({
      language,
    });
    return tests;
  }
};

const getTestQuestion = async ({ testId, userId }) => {
  const test = await Test.findById(testId);
  const numberOfQuestions = _.get(test, "numberOfQuestions");
  const timeLimitByMinutes = _.get(test, "timeLimitByMinutes");

  const testResult = await TestResult.findOne({
    userId,
    testId,
    startIsoDate: {
      $lte: new Date().getTime(),
    },
    endIsoDate: { $gte: new Date().getTime() },
  });

  let questions;
  let timeLeft;
  let testResultId;
  if (testResult) {
    const questionLogs = _.get(testResult, "questionLogs");
    const questionIds = _.map(questionLogs, "questionId");
    const currentQuestions = await Question.find({
      _id: { $in: questionIds },
    }).select("question choice_1 choice_2 choice_3 choice_4");
    const answerMap = _.keyBy(questionLogs, "questionId");

    questions = _.map(currentQuestions, (q) => {
      const currentAnswer = _.get(
        answerMap,
        q._id.toString() + ".answer",
        null
      );
      return _.assign({}, q.toObject(), { currentAnswer });
    });

    const startIsoDate = _.get(testResult, "startIsoDate");
    timeLeft =
      timeLimitByMinutes * 60 -
      Math.round(
        (new Date().getTime() - new Date(startIsoDate).getTime()) / 1000
      );
    testResultId = _.get(testResult, "_id");
  } else {
    questions = await Question.aggregate([
      {
        $match: {
          testId,
          readingText: { $exists: false },
          questionType: { $ne: "Reading" },
        },
      }, // lọc theo testId
      { $sample: { size: numberOfQuestions } },
      {
        $project: {
          question: 1,
          choice_1: 1,
          choice_2: 1,
          choice_3: 1,
          choice_4: 1,
          answer: 1,
        },
      },
    ]);

    const questionLogs = _.map(questions, (question) => ({
      questionId: question._id,
      answer: 0,
      correctAnswer: question.answer,
    }));
    const startIsoDate = new Date().getTime();
    timeLeft = timeLimitByMinutes * 60;
    const testResult = await TestResult.create({
      userId,
      testId,
      questionLogs,
      startIsoDate,
      endIsoDate: new Date().getTime() + timeLimitByMinutes * 60 * 1000,
    });
    testResultId = _.get(testResult, "_id");
  }

  return { questions, test, timeLeft, testResultId };
};

const submitAnswer = async ({ testResultId, questionId, selectedAnswer }) => {
  const testResult = await TestResult.findOne({
    _id: testResultId,
    endIsoDate: { $gt: new Date() },
  });

  if (!testResult) {
    throw new Error("Hết thời gian hoặc không tìm thấy kết quả.");
  }

  const index = testResult.questionLogs.findIndex(
    (q) => q.questionId.toString() === questionId.toString()
  );

  if (index === -1) {
    throw new Error("Không tìm thấy câu hỏi trong kết quả.");
  }

  testResult.questionLogs[index].answer = selectedAnswer;

  await testResult.save();
};

const submitTest = async ({ testResultId }) => {
  const testResult = await TestResult.findById(testResultId).populate("testId");

  let grade = 0;
  const gradePerQuestion =
    testResult.testId.maxGrade / testResult.testId.numberOfQuestions;
  for (const questionLog of testResult.questionLogs) {
    if (questionLog.answer === questionLog.correctAnswer) {
      grade += gradePerQuestion;
    }
  }
  testResult.grade = grade;
  testResult.endIsoDate = new Date().getTime();
  await testResult.save();
};

const getTestResult = async ({ testResultId }) => {
  const testResult = await TestResult.findById(testResultId).populate("testId");
  if (!testResult) {
    throw new Error("Không tìm thấy kết quả.");
  }
  const questionIds = _.map(testResult.questionLogs, "questionId");

  const questions = await Question.find({
    _id: { $in: questionIds },
  }).select("_id question choice_1 choice_2 choice_3 choice_4 answer");

  return {
    test: testResult.testId,
    questionLogs: testResult.questionLogs,
    questions,
    grade: testResult.grade,
  };
};

const getTestHistory = async ({ userId, testId }) => {
  const testResults = await TestResult.find({
    userId,
    testId,
    grade: { $exists: true },
  })
    .populate("testId")
    .sort({ createdAt: -1 })
    .select("testId startIsoDate createdAt grade");
  return testResults;
};
module.exports = {
  getTests,
  getTestQuestion,
  submitAnswer,
  submitTest,
  getTestResult,
  getTestHistory,
};
