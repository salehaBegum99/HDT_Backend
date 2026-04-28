const generateCandidateId = async (User) => {
  const year = new Date().getFullYear();

  // ✅ Sequelize: count() instead of countDocuments()
  const count = await User.count({
    where: { role: 'APPLICANT' }
  });

  const serial = String(count + 1).padStart(4, '0');
  return `SCH${year}${serial}`; // e.g. SCH20260001
};

module.exports = generateCandidateId;