const { uploadImageToImgur } = require("../common/utils");
const adminService = require("../services/admin.service");

const fetchApplicationForms = async (req, res) => {
  try {
    const { page, itemPerPage, filterStatus, userId, username } = req.body;
    const { applicationForms, totalDocuments } =
      await adminService.fetchApplicationForms({
        page,
        itemPerPage,
        filterStatus,
        userId,
        username,
      });
    res.status(200).json({ applicationForms, totalDocuments });
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

const getOrderStatistics = async (req, res) => {
  try {
    const orderStatistics = await adminService.getOrderStatistics();
    res.status(200).json(orderStatistics);
  } catch (err) {
    res.status(500).json(err);
  }
};

const getMonthlySales = async (req, res) => {
  try {
    const monthlySales = await adminService.getMonthlySales();
    res.status(200).json(monthlySales);
  } catch (err) {
    res.status(500).json(err);
  }
};

const getLanguageFrequent = async (req, res) => {
  try {
    const languageFrequent = await adminService.getLanguageFrequent();
    res.status(200).json(languageFrequent);
  } catch (err) {
    res.status(500).json(err);
  }
};

const getTeachersSalary = async (req, res) => {
  try {
    const { filterStatus, searchTerm } = req.body;
    const salary = await adminService.getTeachersSalary({
      salaryPaymentStatus: filterStatus,
      teacherName: searchTerm,
    });
    res.status(200).json(salary);
  } catch (err) {
    res.status(500).json(err);
  }
};

const getVietQRPayment = async (req, res) => {
  try {
    const { teacherId, amount, year, month } = req.body;
    const vietQRPaymentUrl = await adminService.getVietQRPayment({
      teacherId,
      amount,
      month,
      year,
    });
    res.status(200).json(vietQRPaymentUrl);
  } catch (err) {
    res.status(500).json(err);
  }
};

const salaryPaymentComplete = async (req, res) => {
  try {
    const { teacherId, year, month, paymentByAdminId, paymentByAdminName } =
      req.body;
    const salaryPayment = await adminService.salaryPaymentComplete({
      teacherId,
      paymentByAdminId,
      paymentByAdminName,
      month,
      year,
    });

    res.status(200).json(salaryPayment);
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
  getOrderStatistics,
  getMonthlySales,
  getLanguageFrequent,
  getTeachersSalary,
  getVietQRPayment,
  salaryPaymentComplete,
};
