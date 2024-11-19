import React, { useState } from "react";

const SelectMidiChannelIn = ({ onChannelChange }) => {
  const [channel, setChannel] = useState("");

  const handleChange = (event) => {
    const value = event.target.value;

    // Only allow numbers between 1 and 16
    if (value === "" || (/^\d+$/.test(value) && +value >= 1 && +value <= 16)) {
      setChannel(value);
      if (onChannelChange) {
        onChannelChange(+value); // Pass the updated channel value to parent component
      }
    }
  };

  return (
    <div>
      <label htmlFor="midi-channel">Select MIDI Input Channel:</label>
      <input
        id="midi-channel"
        type="text"
        value={channel}
        onChange={handleChange}
        placeholder="Enter 1-16"
      />
    </div>
  );
};

export default SelectMidiChannelIn;