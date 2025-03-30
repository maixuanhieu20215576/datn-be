const constants = {
  userRole: {
    admin: "admin",
    student: "student",
    teacher: "teacher",
  },
  language: {
    vietnamese: "vi",
    english: "en",
  },
  commitment: {
    fulltime: "Full-time",
    parttime: "Part-time",
  },
  applicationStatus: {
    all: "All",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  },
  entranceExamField: {
    mathematics: "Mathematics",
    experimentalSciences: "Experimental Sciences",
    humanities: "Humanities",
    art: "Art",
    language: "Language",
  },
  questionType: {
    unknown: "Unknown",
    reading: "Reading",
    grammar: "Grammar",
    vocab: "Vocab",
  },
  courseLevel: {
    ALL: "All levels",
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    EXPERT: "Expert",
  },
  paymentStatus: {
    all: "All",
    pending: "Pending",
    success: "Success",
    failed: "Failed",
  },
  classType: {
    singleClass: "singleClass",
    classByWeeks: "classByWeeks",
  },
  priceType: {
    byDay: "byDay",
    byCourse: "byCourse",
  },
};

module.exports = { constants };
