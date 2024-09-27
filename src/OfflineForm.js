import React from 'react';

const OfflineForm = () => {
  return (
    <div className="tab-content">
      <p className="subtitle">
        x Upload a bass track MIDI file and get a drum track. Make sure your bass track is in tempo 100 and rhythm 4/4.
      </p>
      
      <form method="post" action={`${process.env.REACT_APP_BACKEND_URL}/offline`} encType="multipart/form-data">
      {/* <form method="post" action="http://localhost:3009/offline" encType="multipart/form-data"> */}
        <div className="file-input-container">
          <label htmlFor="file">Choose a file</label>
          <input type="file" name="file" id="file" className="inputfile" required />
        </div>
        <div className="checkbox-container">
          <input type="checkbox" id="assign-velocity" name="assign-velocity" />
          <label htmlFor="assign-velocity">Assign Velocity to Drum Track</label>
        </div>
        <button type="submit" className="button">Submit</button>
      </form>
    </div>
  );
};

export default OfflineForm;
