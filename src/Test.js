import React, { useEffect, useState } from 'react';

const LogStrings = () => {
  const stringsWithTimings = [
    { text: 'First message', time: 1 },   // Log after 1 second
    { text: 'Second message', time: 2 },  // Log after 2 seconds
    { text: 'Third message', time: 3 },   // Log after 3 seconds
  ];

  const [isLogging, setIsLogging] = useState(false); // State to track if logging is in progress
  const [queue, setQueue] = useState([]); // Queue to hold logging requests

  // Function to create a delay
  const delay = (duration) => {
    return new Promise((resolve) => {
      setTimeout(resolve, duration * 1000); // Convert seconds to milliseconds
    });
  };

  const logMessages = async () => {
    setIsLogging(true); // Set logging to true
    for (const { text, time } of stringsWithTimings) {
      await delay(time); // Wait for the specified time
      console.log(text); // Log the message
    }
    setIsLogging(false); // Reset logging status after completion
    processNext(); // Process the next item in the queue if any
  };

  const processNext = () => {
    if (queue.length > 0 && !isLogging) {
      const nextLog = queue.shift(); // Get the next logging request
      logMessages(); // Call logMessages for the next request
    }
  };

  const handleLogButtonClick = () => {
    setQueue((prevQueue) => [...prevQueue, {}]); // Add a new request to the queue
    if (!isLogging) {
      logMessages(); // Start logging if not already in progress
    }
  };

  return (
    <div>
      <h1>Logging Messages</h1>
      <button onClick={handleLogButtonClick}>
        {isLogging ? 'Logging in progress...' : 'Log Messages'}
      </button>
      <p>Check the console for logged messages.</p>
    </div>
  );
};

export default LogStrings;
