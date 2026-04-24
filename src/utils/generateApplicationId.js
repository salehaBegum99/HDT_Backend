const generateApplicationId = async (Application, candidateId) => {
  const year = new Date().getFullYear();
  
  // Count existing applications this year to generate serial
  const count = await Application.countDocuments({
    createdAt: {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`)
    }
  });

  // Format: SCH-2026-SCH20260001-A001
  const serial = String(count + 1).padStart(3, '0');
  return `SCH-${year}-${candidateId}-A${serial}`;
};

module.exports = generateApplicationId;