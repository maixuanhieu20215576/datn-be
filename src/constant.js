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
    listening: "Listening",
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
  languages: {
    English: "Tiếng Anh",
    Japanese: "Tiếng Nhật",
    Chinese: "Tiếng Trung",
    Korean: "Tiếng Hàn",
    Thai: "Tiếng Thái",
    Spanish: "Tiếng Tây Ban Nha",
    German: "Tiếng Đức",
    Arabic: "Tiếng Ả Rập",
    Polish: "Tiếng Ba Lan",
    French: "Tiếng Pháp",
    Russian: "Tiếng Nga",
    Italian: "Tiếng Ý",
  },
  classStatus: {
    closed: "closed",
    open: "open",
  },
  attendanceStatus: {
    absend: "absend",
    present: "present",
    ontime: "ontime",
    late: "late",
  },
  salaryPaymentStatus: {
    unpaid: "unpaid",
    paid: "paid",
  },
  notificationStatus: {
    seen: "seen",
    new: "new",
  },
  courseLearningProcessStatus: {
    done: "done",
    undone: "undone",
  },
  commentVoteType: {
    upvote: "upvote",
    downvote: "downvote",
  },
};

module.exports = { constants };
