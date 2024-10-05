import React, { useState, useEffect } from 'react';
import Tabs from './Tabs';
import OfflineForm from './OfflineForm';
import RealtimeForm from './RealtimeForm';
import Test from './Test';
import './App.css';


function App() {
  const [activeTab, setActiveTab] = useState('offline');
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };
  return (
    <div className="container">
      <h1 id="title">Drum Generator for Your Bass Track</h1>
      <Tabs activeTab={activeTab} onTabClick={handleTabClick} />
      {activeTab === 'offline' ? <OfflineForm /> : <RealtimeForm />}
      {/* {activeTab === 'offline' ? <OfflineForm /> : <Test />} */}
    </div>
  );
}

export default App;
