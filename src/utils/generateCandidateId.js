const generateCandidateId = async (UserModel) => {
  const year = new Date().getFullYear(); // 2026

  // Count how many applicants exist this year
  const count = await UserModel.countDocuments({
    role: "APPLICANT",
    createdAt: {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`),
    },
  });

  // Pad to 4 digits → 0001, 0002, 0023, 0100
  const serial = String(count + 1).padStart(4, "0");

  return `SCH${year}${serial}`; // SCH20260001
};

module.exports = generateCandidateId;
