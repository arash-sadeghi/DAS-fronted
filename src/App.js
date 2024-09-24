import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';


function App() {
  const [status, setStatus] = useState('Connecting to MIDI devices...');
  const [socketState, setSocketState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  
  useEffect(() => {
    const backendURL = 'http://localhost:3009' 
    // const backendURL = "http://18.219.112.226:3009"

    const socket = io(backendURL);

    setSocketState(socket);
    socket.on('connect', () => {
        console.log('Connected to WebSocket server!');
    });

      // Handle incoming messages
    socket.on('message', (data) => {
      console.log('Message from server:', data);
      setMessages((prevMessages) => [...prevMessages, data]);
    });

      // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Function to listen for MIDI devices and send messages
    const listenToMIDIDevices = () => {
      if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then((access) => {
          console.log('midi access granted');
          const inputs = access.inputs.values();

          for (let input of inputs) {
            input.onmidimessage = (message) => {
              const data = Array.from(message.data);
              console.log('MIDI data received:', data);
              var vel = 0
              if (data.length>2){ //! sometime length of data is two with some wierd control changes. I need to transfer consistent lenght of data
                vel = data[2];
              }
              const mdid_message={
                type: data[0],
                note: data[1],
                velocity: vel
              };

              socket.send(JSON.stringify(mdid_message));
            };
            setStatus(`MIDI device connected: ${input.name}`);
            console.log('Listening to MIDI input:', input.name);
          }
        }).catch((err) => {
          console.error('MIDI access request failed:', err);
          setStatus('MIDI access request failed');
        });
      } else {
        setStatus('Web MIDI API is not supported by this browser.');
      }
    };
    listenToMIDIDevices();
    return () => {
      socket.off('connect');
      socket.off('message');
      socket.off('disconnect');
    };
      
  }, []);

  const sendMessage = (event) => {
    event.preventDefault(); // Prevent the default form submission
    if (input.trim()) {
        socketState.send(input); // Send the input value through WebSocket
        setInput(''); // Clear the input field
        console.log('siiii')
    }
  };


  return (
    <div>
      <h1>WebSocket Client x pipe test 2 </h1>
      <h2>Messages from Server:</h2>
      <ul>
        {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
        ))}
      </ul>
      <form onSubmit={sendMessage}>
        <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;
