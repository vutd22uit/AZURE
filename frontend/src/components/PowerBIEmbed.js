import React, { useState, useEffect } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';
import axios from 'axios';

/**
 * Power BI Embedded Report Component
 * Displays embedded Power BI reports with authentication
 */
const PowerBIEmbedComponent = ({ reportType = 'overview' }) => {
  const [embedConfig, setEmbedConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmbedToken();
  }, [reportType]);

  const fetchEmbedToken = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get JWT token from localStorage
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Please log in to view analytics');
      }

      // Get embed token from backend
      const response = await axios.get(
        `${process.env.REACT_APP_ORDER_SERVICE_URL || 'http://localhost:3002'}/api/powerbi/embed-token`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { embedToken, embedUrl, reportId } = response.data;

      // Configure Power BI embed
      const config = {
        type: 'report',
        id: reportId,
        embedUrl: embedUrl,
        accessToken: embedToken,
        tokenType: models.TokenType.Embed,
        settings: {
          panes: {
            filters: {
              expanded: false,
              visible: true,
            },
            pageNavigation: {
              visible: true,
            },
          },
          background: models.BackgroundType.Transparent,
          filterPaneEnabled: true,
          navContentPaneEnabled: true,
        },
      };

      setEmbedConfig(config);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching embed token:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load Power BI report');
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchEmbedToken();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Power BI Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Report</h3>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="powerbi-container h-screen w-full">
      {embedConfig && (
        <PowerBIEmbed
          embedConfig={embedConfig}
          eventHandlers={
            new Map([
              [
                'loaded',
                function () {
                  console.log('Power BI Report loaded');
                },
              ],
              [
                'rendered',
                function () {
                  console.log('Power BI Report rendered');
                },
              ],
              [
                'error',
                function (event) {
                  console.error('Power BI Error:', event.detail);
                },
              ],
            ])
          }
          cssClassName="powerbi-report-container"
          getEmbeddedComponent={(embeddedReport) => {
            window.report = embeddedReport;
          }}
        />
      )}
    </div>
  );
};

export default PowerBIEmbedComponent;
