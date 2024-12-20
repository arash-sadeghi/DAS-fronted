import React from 'react';

const Tabs = ({ activeTab, onTabClick }) => {
  return (
    <div className="tabs">
      <button
        className={`tab-button ${activeTab === 'offline' ? 'active' : ''}`}
        onClick={() => onTabClick('offline')}
      >
        Offline Drum Accompaniment
      </button>
      <button
        className={`tab-button ${activeTab === 'realtime' ? 'active' : ''}`}
        onClick={() => onTabClick('realtime')}
      >
        Real-time Drum Accompaniment
      </button>
      <button
        className={`tab-button ${activeTab === 'piano' ? 'active' : ''}`}
        onClick={() => onTabClick('piano')}
      >
        Interactive MIDI Piano
      </button>

    </div>
  );
};

export default Tabs;
