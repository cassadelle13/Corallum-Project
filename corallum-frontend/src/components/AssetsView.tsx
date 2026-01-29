import React, { useState } from 'react';
import { Package, Info, Search, AlertCircle } from 'lucide-react';

interface AssetsViewProps {
  searchQuery?: string;
}

export const AssetsView: React.FC<AssetsViewProps> = ({ searchQuery: externalSearch }) => {
  const [localSearch, setLocalSearch] = useState('');
  const query = externalSearch || localSearch;

  return (
    <div className="assets-view">
      <div className="view-header">
        <div className="header-title">
          <Package size={20} />
          <h1>Assets</h1>
          <Info size={16} />
        </div>
      </div>

      <div className="assets-content">
        <div className="assets-warning glass-panel">
          <AlertCircle size={20} />
          <div>
            <p><strong>Assets may be missing from this page</strong></p>
            <p>Assets are not detected for old scripts and flows that were deployed before the assets feature was introduced. Re-deploy them to trigger asset detection.</p>
          </div>
        </div>

        <div className="assets-search">
          <div className="search-bar glass-panel">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search assets"
              value={query}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="assets-table">
          <table>
            <thead>
              <tr>
                <th>Asset name</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={1} className="empty-table">
                  <div className="empty-state">
                    <Package size={48} />
                    <p className="empty-title"><strong>No assets found</strong></p>
                    <p className="empty-description">
                      {query ? `No assets match "${query}"` : 'Assets will appear here when detected in your scripts and flows'}
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

