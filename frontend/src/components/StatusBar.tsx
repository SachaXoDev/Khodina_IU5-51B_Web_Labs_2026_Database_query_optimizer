import React from 'react';

export const StatusBar: React.FC = () => {
  return (
    <div className="ios-status-bar">
      <span className="ios-status-time">9:41</span>
      <div className="ios-status-icons">
        {/* Cellular Signal */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill="none" className="ios-icon">
          <rect x="0" y="8" width="3" height="3" rx="0.5" fill="currentColor" />
          <rect x="4.5" y="5.5" width="3" height="5.5" rx="0.5" fill="currentColor" />
          <rect x="9" y="3" width="3" height="8" rx="0.5" fill="currentColor" />
          <rect x="13.5" y="0.5" width="3" height="10.5" rx="0.5" fill="currentColor" />
        </svg>

        {/* Wi-Fi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none" className="ios-icon">
          <path
            d="M7.5 11C8.32843 11 9 10.3284 9 9.5C9 8.67157 8.32843 8 7.5 8C6.67157 8 6 8.67157 6 9.5C6 10.3284 6.67157 11 7.5 11Z"
            fill="currentColor"
          />
          <path
            d="M4.31802 6.68198C6.07538 4.92462 8.92462 4.92462 10.682 6.68198"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M1.84315 4.20711C4.96734 1.08291 10.0327 1.08291 13.1569 4.20711"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none" className="ios-icon">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" />
          <rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" />
          <path d="M23 4C23.5523 4 24 4.44772 24 5V7C24 7.55228 23.5523 8 23 8V4Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
};

export default StatusBar;
