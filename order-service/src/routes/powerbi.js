const express = require('express');
const router = express.Router();
const powerbiController = require('../controllers/powerbiController');
const auth = require('../middleware/auth');

/**
 * Power BI Embedded Routes
 * All routes require authentication
 */

/**
 * @route   GET /api/powerbi/embed-token
 * @desc    Get embed token for Power BI report
 * @access  Private (requires authentication)
 */
router.get('/embed-token', auth, powerbiController.getEmbedToken);

/**
 * @route   GET /api/powerbi/reports
 * @desc    Get list of available Power BI reports
 * @access  Private (requires authentication)
 */
router.get('/reports', auth, powerbiController.getReports);

/**
 * @route   GET /api/powerbi/config
 * @desc    Get Power BI configuration status
 * @access  Private (requires authentication)
 */
router.get('/config', auth, powerbiController.getConfig);

/**
 * @route   GET /api/powerbi/health
 * @desc    Health check for Power BI service
 * @access  Public
 */
router.get('/health', powerbiController.healthCheck);

module.exports = router;
