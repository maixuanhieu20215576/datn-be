const { uploadImageToImgur } = require("../common/utils");
const adminService = require("../services/admin.service");


const fetchApplicationForms = async (req, res) => {
  try {
    const { page, itemPerPage, filterStatus, userId } = req.body;
    const applicationForms = await adminService.fetchApplicationForms({
      page,
      itemPerPage,
      filterStatus,
      userId,
    });
    res.status(200).json(applicationForms);
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateApplicationFormStatus = async (req, res) => {
  try {
    const { updateStatus, applicationFormId } = req.body;
    await adminService.updateApplicationFormStatus({
      updateStatus,
      applicationFormId,
    });
    res.status(200).json("Success!");
  } catch (err) {
    res.status(500).json(err);
  }
};

const fetchTeacherList = async (req, res) => {
  try {
    const { teachingLanguage } = req.body;
    const teacherList = await adminService.fetchTeacherList({
      teachingLanguage,
    });
    res.status(200).json(teacherList);
  } catch (err) {
    res.status(500).json(err);
  }
};

const createClass = async (req, res) => {
  try {
    let thumbnail;
    if (req.file) {
      thumbnail = await uploadImageToImgur({ requestFile: req.file });
    } else {
      // Nếu không có file, sử dụng trực tiếp text được gửi
      thumbnail = req.body.thumbnail;
    }
    await adminService.createClass(req.body, thumbnail);
    res.status(200).json("Create class successfully!");
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateClass = async (req, res) => {
  try {
    let thumbnail;
    if (req.file) {
      thumbnail = await uploadImageToImgur({ requestFile: req.file });
    } else {
      // Nếu không có file, sử dụng trực tiếp text được gửi
      thumbnail = req.body.thumbnail;
    }
    const { classId } = req.params;
    const updatedClass = await adminService.updateClass(
      classId,
      req.body,
      thumbnail
    );
    res.status(200).json(updatedClass);
  } catch (err) {
    res.status(500).json(err);
  }
};

const fetchClass = async (req, res) => {
  try {
    const { searchValue, page } = req.body;

    const { classes, totalClasses } = await adminService.fetchClass({
      searchValue,
      page,
    });
    res.status(200).json({ classes, totalClasses });
  } catch (err) {
    res.status(500).json(err);
  }
};

const fetchClassById = async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentInfo, classInfo } = await adminService.fetchClassById({
      classId,
    });
    res.status(200).json({ studentInfo, classInfo });
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  fetchApplicationForms,
  updateApplicationFormStatus,
  fetchTeacherList,
  createClass,
  fetchClass,
  fetchClassById,
  updateClass,
};
