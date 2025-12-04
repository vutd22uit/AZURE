const axios = require('axios');
const msal = require('@azure/msal-node');

/**
 * Power BI Embedded Controller
 * Handles generation of embed tokens for Power BI reports
 */

// MSAL configuration for Azure AD authentication
const msalConfig = {
  auth: {
    clientId: process.env.POWERBI_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.POWERBI_TENANT_ID}`,
    clientSecret: process.env.POWERBI_CLIENT_SECRET,
  },
};

// Power BI configuration
const powerbiConfig = {
  workspaceId: process.env.POWERBI_WORKSPACE_ID,
  reportId: process.env.POWERBI_REPORT_ID,
  datasetId: process.env.POWERBI_DATASET_ID,
};

// Initialize MSAL client
const msalClient = new msal.ConfidentialClientApplication(msalConfig);

/**
 * Get Azure AD access token for Power BI API
 */
async function getAccessToken() {
  try {
    const tokenRequest = {
      scopes: ['https://analysis.windows.net/powerbi/api/.default'],
    };

    const response = await msalClient.acquireTokenByClientCredential(tokenRequest);
    return response.accessToken;
  } catch (error) {
    console.error('Error acquiring access token:', error);
    throw new Error('Failed to acquire access token');
  }
}

/**
 * Get embed token for a Power BI report
 * @route GET /api/powerbi/embed-token
 */
async function getEmbedToken(req, res) {
  try {
    // Get authenticated user info (from JWT middleware)
    const userId = req.user?.id;
    const userRole = req.user?.role || 'User'; // Default to 'User' role

    console.log(`Generating embed token for user ${userId} with role ${userRole}`);

    // Get Azure AD access token
    const accessToken = await getAccessToken();

    // Prepare the request to generate embed token
    const embedTokenUrl = `https://api.powerbi.com/v1.0/myorg/groups/${powerbiConfig.workspaceId}/reports/${powerbiConfig.reportId}/GenerateToken`;

    const requestBody = {
      accessLevel: 'View',
      allowSaveAs: false,
      identities: [
        {
          username: userId?.toString() || 'anonymous',
          roles: [userRole],
          datasets: [powerbiConfig.datasetId],
        },
      ],
    };

    // Call Power BI REST API to generate embed token
    const response = await axios.post(embedTokenUrl, requestBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Return embed configuration to frontend
    res.json({
      success: true,
      embedToken: response.data.token,
      embedUrl: response.data.embedUrl || `https://app.powerbi.com/reportEmbed?reportId=${powerbiConfig.reportId}&groupId=${powerbiConfig.workspaceId}`,
      reportId: powerbiConfig.reportId,
      expiresAt: response.data.expiration,
      tokenId: response.data.tokenId,
    });
  } catch (error) {
    console.error('Error generating embed token:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid Azure AD credentials',
      });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Power BI report or workspace not found',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate embed token',
      details: error.message,
    });
  }
}

/**
 * Get list of available reports in workspace
 * @route GET /api/powerbi/reports
 */
async function getReports(req, res) {
  try {
    // Get Azure AD access token
    const accessToken = await getAccessToken();

    // Get reports from Power BI workspace
    const reportsUrl = `https://api.powerbi.com/v1.0/myorg/groups/${powerbiConfig.workspaceId}/reports`;

    const response = await axios.get(reportsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    res.json({
      success: true,
      reports: response.data.value.map(report => ({
        id: report.id,
        name: report.name,
        webUrl: report.webUrl,
        embedUrl: report.embedUrl,
        datasetId: report.datasetId,
      })),
    });
  } catch (error) {
    console.error('Error fetching reports:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      details: error.message,
    });
  }
}

/**
 * Get configuration info (without secrets)
 * @route GET /api/powerbi/config
 */
async function getConfig(req, res) {
  try {
    const isConfigured = !!(
      process.env.POWERBI_CLIENT_ID &&
      process.env.POWERBI_TENANT_ID &&
      process.env.POWERBI_CLIENT_SECRET &&
      process.env.POWERBI_WORKSPACE_ID &&
      process.env.POWERBI_REPORT_ID
    );

    res.json({
      success: true,
      configured: isConfigured,
      workspaceId: powerbiConfig.workspaceId || 'Not configured',
      reportId: powerbiConfig.reportId || 'Not configured',
      datasetId: powerbiConfig.datasetId || 'Not configured',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration',
    });
  }
}

/**
 * Health check for Power BI service
 * @route GET /api/powerbi/health
 */
async function healthCheck(req, res) {
  try {
    // Try to get access token to verify credentials
    const accessToken = await getAccessToken();

    res.json({
      success: true,
      status: 'healthy',
      message: 'Power BI service is connected and operational',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: 'Power BI service connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = {
  getEmbedToken,
  getReports,
  getConfig,
  healthCheck,
};
