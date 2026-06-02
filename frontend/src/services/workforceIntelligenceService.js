import api from './api';

/**
 * workforceIntelligenceService.js
 * ================================
 * Service for AI-4 workforce intelligence features.
 */

/**
 * Get burnout risk for the current employee
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise} Burnout response with risk score and recommendations
 */
export const getMyBurnoutRisk = async (month, year) => {
    const res = await api.get('/ai/burnout/me', { params: { month, year } });
    return res.data;
};

/**
 * Get burnout risk for a specific employee (manager only)
 * @param {number} employeeId - Employee ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise} Burnout response
 */
export const getEmployeeBurnoutRisk = async (employeeId, month, year) => {
    const res = await api.get(`/ai/burnout/${employeeId}`, { params: { month, year } });
    return res.data;
};

/**
 * Check AI service health
 * @returns {Promise} Health status
 */
export const getAiHealth = async () => {
    const res = await api.get('/ai/health');
    return res.data;
};