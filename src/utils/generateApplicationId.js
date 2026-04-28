// ✅ Fixed — Sequelize version
const { Op } = require('sequelize');

const generateApplicationId = async (Application, candidateId) => {
  const year = new Date().getFullYear();

  // ✅ Sequelize: count() with Op.between instead of countDocuments
  const count = await Application.count({
    where: {
      createdAt: {
        [Op.gte]: new Date(`${year}-01-01`),
        [Op.lte]: new Date(`${year}-12-31`),
      }
    }
  });

  // Format: SCH-2026-SCH20260001-A001
  const serial = String(count + 1).padStart(3, '0');
  return `SCH-${year}-${candidateId}-A${serial}`;
};

module.exports = generateApplicationId;