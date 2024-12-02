import React, { useState, useEffect, useRef } from "react";

const LogViewerBassReceive = ({ messages }) => {
  const logRef = useRef(null);

  // Scroll to the bottom of the log when messages update
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  return (
      <div style={styles.log} ref={logRef}>
        {messages.map((msg, index) => (
          <div key={index} style={styles.logMessage}>
            {msg}
          </div>
        ))}
      </div>
  );
};

export default LogViewerBassReceive;

const styles = {
  log: {
    border: "1px solid #ccc",
    borderRadius: "5px",
    height: "300px",
    overflowY: "auto",
    padding: "10px",
    backgroundColor: "#f9f9f9",
  },
  logMessage: {
    marginBottom: "5px",
    fontSize: "14px",
    fontFamily: "Courier, monospace",
  },
};