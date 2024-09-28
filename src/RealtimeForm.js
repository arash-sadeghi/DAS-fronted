import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';


const RealtimeForm = () => {
    const [midiPorts, setMidiPorts] = useState([]);
    const [selectedPort, setSelectedPort] = useState('');
	const [isRunning, setIsRunning] = useState(false);
	const [socketState, setSocketState] = useState(null);

    useEffect(() => {
		const backendURL = process.env.REACT_APP_BACKEND_URL+'/realtime';
		console.log("xxbackendURL",backendURL);
		const socket = io(backendURL);
	
		socket.on('connect', () => {
			console.log('Connected to WebSocket server!');
		});
	
		  // Handle incoming messages
		socket.on('message', (data) => {
		  console.log('Message from server:', data);
		});
	
		  // Handle disconnection
		socket.on('disconnect', () => {
		  console.log('Disconnected from server');
		});

		socket.on('error', () => {
			console.log('Disconnected from server');
		});	

		const listenToMIDIDevices = () => {
			if (navigator.requestMIDIAccess) {
				navigator.requestMIDIAccess().then((access) => {
				console.log('midi access granted');
				const inputs = access.inputs.values();
				console.log("midi inputs", inputs);
				const ports = [];
				for (let input of inputs) {
					ports.push(input.name); // Collect MIDI input port names
					console.log(">",input);
				}
				setMidiPorts(ports);
				setSelectedPort(ports[0]); //! set default selected port to first port
			}).catch((err) => {
					console.error('MIDI access request failed:', err);
					console.log('MIDI access request failed');
				});
			} else {
				console.log('Web MIDI API is not supported by this browser.');
			}
		}
		listenToMIDIDevices();
		setSocketState(socket);
	}, []);

	const handlePortChange = (e) => {
		setSelectedPort(e.target.value);
	  };

	  const startStreamingMidi = async () => {
        setIsRunning(true);
        document.getElementById('message').style.display = 'block';
        document.getElementById('message').innerHTML = 'Real-time processing started!';

		if (selectedPort) {
		  try {
			console.log("streaming: ",selectedPort)

			// Access the MIDI inputs and stream MIDI messages asynchronously
			const access = await navigator.requestMIDIAccess();
			const selectedInput = Array.from(access.inputs.values()).find(input => input.name === selectedPort);
	
			if (selectedInput) {

				socketState.send(JSON.stringify({action: 'Start'}));

				selectedInput.onmidimessage = (message) => {
				const data = Array.from(message.data);  // Convert MIDI message to array
					var vel = 0
					if (data.length>2){ //! sometime length of data is two with some wierd control changes. I need to transfer consistent lenght of data
					  vel = data[2];
					}

					let type = '';
					switch(data[0]){
						case 144: 
							type = 'note_on';
							break;
						case 128: 
							type = 'note_off';
							break;
						case 128: 
							type = 'channel_aftertouch';
							break;
						default:
							type = 'unhandled_control'
						}
					const now = new Date();
					const midi_message={
						action: "Process",
						type: type,
						note: data[1],
						velocity: vel,
						time: now.getTime() / 1000
						};
					console.log('sending',midi_message)
					socketState.send(JSON.stringify(midi_message));
				// }
			  };
			} else {
			  console.error('Selected MIDI port not found');
			}
		  } catch (error) {
			console.error('Error streaming MIDI messages:', error);
		  }
		} else {
		  console.error('No MIDI port selected');
		}
	  };



	const stopRealTime = () => {
		setIsRunning(false);
		document.getElementById('message').style.display = 'block';
		document.getElementById('message').innerHTML = 'Real-time processing stopped!';
		socketState.send(JSON.stringify({action: 'Stop'}));

	};

 	return (
		<div className="tab-content">
		<h1>Real-time</h1>
		<form id="realtime-form">
			<div>
				<select name="midiin" id="midiin" value={selectedPort} onChange={handlePortChange} required>
					{midiPorts.length > 0 ? (
					midiPorts.map((port, index) => (
						<option key={index} value={port}>
						{port}
						</option>
					))
					) : (
					<option value="">No MIDI ports available</option>
					)}
				</select>
			</div>
			<button type="button" onClick={startStreamingMidi} className="button" disabled={isRunning}>Start</button>
			<button type="button" onClick={stopRealTime} className="button" disabled={!isRunning}>Stop</button>
		</form>
		<p id="message" className="message" style={{ display: 'none' }}></p>
		</div>
  );
};

export default RealtimeForm;
