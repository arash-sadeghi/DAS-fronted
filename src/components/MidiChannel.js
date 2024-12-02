import React, { useState } from "react";

const SelectMidiChannel = ({ onChannelChange }) => {
  const [channel, setChannel] = useState("1");

  const handleChange = (event) => {
    const value = event.target.value;
    setChannel(value);
    if (onChannelChange) {
      // Pass the updated channel value to the parent component
      onChannelChange(value === "ALL" ? "ALL" : +value); // Convert to number if not "ALL"
    }
  };

  return (
    <div>
      <label htmlFor="midi-channel"> MIDI Channel:</label>
      <select id="midi-channel" value={channel} onChange={handleChange} style={styles.channelSelect}>
        <option value="ALL">ALL</option>
        {Array.from({ length: 16 }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </select>
    </div>
  );
};

const styles = {
  channelSelect: {
    width : '8em',
  },
}

export default SelectMidiChannel;