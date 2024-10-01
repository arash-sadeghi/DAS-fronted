import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const RealtimeMidi = () => {
  const [midiPorts, setMidiPorts] = useState([]);
  const [selectedPortOut, setSelectedPortOut] = useState('');
  const [midiAccess, setMidiAccess] = useState(null);
  const [socket, setSocket] = useState(null);

  // Request MIDI access and set up the ports
  useEffect(() => {
    const initMIDI = async () => {
      try {
        const access = await navigator.requestMIDIAccess();
        setMidiAccess(access);

        // Get available MIDI output ports
        const outputs = Array.from(access.outputs.values());
        setMidiPorts(outputs);
        setSelectedPortOut(outputs.length > 0 ? outputs[0].id : '');

        access.onstatechange = updateMIDIOutputs; // Detect connection/disconnection of MIDI devices
      } catch (err) {
        console.error('MIDI access request failed:', err);
      }
    };

    const updateMIDIOutputs = () => {
      const outputs = Array.from(midiAccess.outputs.values());
      setMidiPorts(outputs);
    };

    initMIDI();

    // Setup WebSocket connection to listen to MIDI messages from the server
    const socket = io(process.env.REACT_APP_BACKEND_URL);
    setSocket(socket);

    // Listen for incoming MIDI messages from the server
    socket.on('message', (data) => {
        console.log('message came');
      handleIncomingMidiMessage(data);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [midiAccess]);

  const handlePortChangeOut = (e) => {
    setSelectedPortOut(e.target.value);
  };

  const handleIncomingMidiMessage = (data) => {
    if (!selectedPortOut || !midiAccess) {
      console.error('No MIDI output port selected');
      return;
    }

    const selectedOutputPort = midiAccess.outputs.get(selectedPortOut);

    if (!selectedOutputPort) {
      console.error('Selected MIDI output port not found');
      return;
    }

    try {
    //   const midiMessages = JSON.parse(data); // Parse MIDI message from the server

        console.log("data",data)
      //   midiMessages.forEach(message => {
    //     const midiMessage = [
    //       message.type === 'note_on' ? 0x90 : 0x80, // Note On or Note Off
    //       message.note,
    //       message.velocity,
    //     ];
    //     console.log('Sending MIDI message:', midiMessage);
    //     selectedOutputPort.send(midiMessage); // Send MIDI message to the selected port
    //   });
    } catch (error) {
      console.error('Error handling incoming MIDI message:', error);
    }
  };

  return (
    <div className="realtime-midi">
      <h1>Real-time MIDI</h1>

      <div>
        <label>MIDI Output Port:</label>
        <select onChange={handlePortChangeOut} value={selectedPortOut}>
          {midiPorts.length > 0 ? (
            midiPorts.map((port) => (
              <option key={port.id} value={port.id}>
                {port.name}
              </option>
            ))
          ) : (
            <option value="">No MIDI output ports available</option>
          )}
        </select>
      </div>

      <p>Listening for MIDI messages from the server and sending them to the selected MIDI output...</p>
    </div>
  );
};

export default RealtimeMidi;
