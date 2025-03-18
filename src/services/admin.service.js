const { constants } = require("../constant");
const ApplicationForm = require("../models/applicationForm.model");

const fetchApplicationForms = async ({
  page,
  itemPerPage,
  filterStatus,
  userId,
}) => {
  let filter = {};
  if (filterStatus !== constants.applicationStatus.all) {
    filter = { status: filterStatus };
  }
  if (userId) {
    filter = { ...filter, userId: userId };
  }

  const applicationForms = await ApplicationForm.find(filter)
    .sort({ createdAt: -1 }) // -1: Giảm dần (mới nhất trước), 1: Tăng dần (cũ nhất trước)
    .skip((page - 1) * itemPerPage)
    .limit(itemPerPage);

  return applicationForms;
};

const updateApplicationFormStatus = async ({
  updateStatus,
  applicationFormId,
}) => {
  await ApplicationForm.findByIdAndUpdate(applicationFormId, {
    status: updateStatus,
  });
};

module.exports = { fetchApplicationForms, updateApplicationFormStatus };
