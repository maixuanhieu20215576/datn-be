const Course = require("../models/Course.model");

const getCourse = async (requestBody) => {
  const {
    language,
    rating,
    level,
    priceFrom,
    priceTo,
    page,
    searchText,
    sortOption,
  } = requestBody;
  const filter = {};
  if (language) {
    filter.language = language;
  }
  if (rating) {
    filter.course_rating = { $gte: rating };
  }
  if (level) {
    filter.course_level = { $lte: level + 1, $gte: level };
  }
  if (priceFrom && priceTo) {
    filter.price_dis = { $gte: priceFrom, $lte: priceTo };
  } else {
    if (priceFrom) {
      filter.price_dis = { $gte: priceFrom / 1000 };
    }
    if (priceTo) {
      filter.price_dis = { $lte: priceTo / 1000 };
    }
  }
  if (searchText) {
    filter.course_name = new RegExp(searchText, "i");
  }
  let sortKey = { createAt: -1, _id: 1 };

  if (sortOption) {
    if (sortOption === "0") {
      sortKey = { createAt: -1, _id: 1 };
    }
    if (sortOption === "1") {
      sortKey = { course_rating: -1, _id: 1 };
    }
    if (sortOption === "2") {
      sortKey = { course_enrollmenters: 1, _id: 1 };
    }
  }
  const limit = 18;
  const skip = (page - 1) * limit;
  const courses = await Course.find(filter)
    .sort(sortKey)
    .skip(skip)
    .limit(limit);
  const totalCourses = await Course.countDocuments(filter);

  return { courses, totalCourses };
};

const getCourseById = async (courseId) => {
  const course = await Course.findById(courseId);
  return course;
};

module.exports = { getCourse, getCourseById };
