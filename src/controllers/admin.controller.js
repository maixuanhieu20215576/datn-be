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
    await adminService.createClass(req.body);
    res.status(200).json("Create class successfully!");
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  fetchApplicationForms,
  updateApplicationFormStatus,
  fetchTeacherList,
  createClass,
};
