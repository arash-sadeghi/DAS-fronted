import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { processResultMidiQueue } from '../utils/PublishResultMidi';



const RealtimeForm = () => {
    const [midiPorts, setMidiPorts] = useState([]);
    const [selectedPortIn, setSelectedPortIn] = useState('');
    const [selectedPortOut, setSelectedPortOut] = useState('');
	const [isRunning, setIsRunning] = useState(false);
	const [socketState, setSocketState] = useState(null);
	const [midiAccess, setMidiAccess] = useState(null);

	const midiAccessRef = useRef(null);  
	const selectedPortOutRef = useRef(null);

    const midiMessageQueue = useRef([]); // **Added queue**
	const isPublishinggMidi = useRef(false); // **Added queue**
    // Process incoming MIDI messages from the queue asynchronously
	const midiPublishDependencies = {
		'isPublishinggMidi': isPublishinggMidi,
		'midiAccessRef' : midiAccessRef,
		'selectedPortOutRef' : selectedPortOutRef,
		'midiAccess' : midiAccess,
		'midiPorts' : midiPorts,
		'midiAccessRef' : midiAccessRef,
		'midiMessageQueue' : midiMessageQueue,	  
	};

	  // Function to extract the MIDI channel
	const getMidiChannel = (statusByte) => {
		const channel = statusByte & 0x0F; // Extract the last 4 bits
		return channel + 1; // Convert to 1-indexed channel
	};

	useEffect(() => {
		console.log('refreshing ws' , midiAccess)
		const socket = io(process.env.REACT_APP_BACKEND_URL+'/realtime');
		setSocketState(socket);
		socket.on('connect', () => {
			console.log('connected to ',process.env.REACT_APP_BACKEND_URL);
		});

		socket.on('server_message', (data) => {
			console.log("xxxxxxxxx message recieved from server")
			midiMessageQueue.current.push(data); // **Enqueue the data**
			processResultMidiQueue(midiPublishDependencies); // **Start processing the queue**
		});

		return () => {
		if (socket) socket.disconnect();
		};
	}, []);

  useEffect( ()=>{
	console.log('refreshing midi , selectedPortOut' , selectedPortOut)
	const initMIDI = async () => {
		try {
			const access = await navigator.requestMIDIAccess();
			setMidiAccess(access);
			midiAccessRef.current = access; 
			const outputs = Array.from(access.outputs.values());
			setMidiPorts(outputs);
			setSelectedPortOut(outputs.length > 0 ? outputs[0].id : '');
			selectedPortOutRef.current = outputs.length > 0 ? outputs[0].id : '';
			access.onstatechange = updateMIDIOutputs; // Detect connection/disconnection of MIDI devices //TODO throwing error
		} catch (err) {
		  console.error('MIDI access request failed:', err);
		}
	  };
  
	  const updateMIDIOutputs = () => {
		const outputs = Array.from(midiAccessRef.current.outputs.values());
		setMidiPorts(outputs);
	  };
  
	   initMIDI();
  },[]);


	const handlePortChangeOut = (e) => {
		console.log('selectedPortOut was',selectedPortOut , '<selectedPortOutRef.current>', selectedPortOutRef.current);
		setSelectedPortOut(e.target.value);
		selectedPortOutRef.current = e.target.value;
		console.log('selectedPortOut changed to selectedPortOut',selectedPortOut , '<selectedPortOutRef.current>', selectedPortOutRef.current , '<e.target.value>' ,  e.target.value);
	};

	const handlePortChangeIn = (e) => {
		setSelectedPortIn(e.target.value);
	};

	const startStreamingMidi = async () => {
		setIsRunning(true);
		document.getElementById('message').style.display = 'block';
		document.getElementById('message').innerHTML = 'Real-time processing started!';

		// setSelectedPortOut(outputs.length > 0 ? outputs[0]?.name : '');
		// setSelectedPortIn(outputs.length >= 0 ? outputs[0]?.name : '');
		let portIn = null;
		if(selectedPortIn === ''){ //! this mean onChange has not triggered for this slection and I will initilize it with first value of options
			portIn =  midiPorts.length >= 0 ? midiPorts[0].name : '';
			setSelectedPortIn(portIn);
		} else{
			portIn = selectedPortIn;
		}

		console.log("streaming: ",selectedPortIn , portIn)
		if (portIn) {
			try {
			const selectedInput = Array.from(midiAccess.inputs.values()).find(input => input.name === portIn);
			console.log(">>>>>>>>>>","portIn" ,portIn, "selectedInput" , selectedInput , "ports" , midiPorts , 'access',midiAccess, Array.from(midiAccess.inputs.values()) )
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
						channel: getMidiChannel(data[0]),
						note: data[1],
						velocity: vel,
						time: now.getTime() / 1000
					};
					// console.log('socket is emmiting to server')
					socketState.send(JSON.stringify(midi_message));
					// console.log("sent midi message to server on channel",getMidiChannel(data[0]));
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
		<h1>Real-time Improv</h1>
		<p>Recommended browser is Chrome and recommended OS is OSX</p>
		<form id="realtime-form">
			<div>
				<label>MIDI Input Port:</label>
				<select name="midiin" id="midiin"  onChange={handlePortChangeIn} value={selectedPortIn} required>
					{midiPorts.length > 0 ? (
						midiPorts.map((port) => (
						<option key={port.id} value={port.id}>
							{port.name}
						</option>
						))
					) : (
						<option value="">No MIDI in ports available</option>
					)}
				</select>
				</div>
				<div>	
					<label>MIDI Output Port:</label>
					<select name="midiin" id="midiin"  onChange={handlePortChangeOut} value={selectedPortOut} required>
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

			<button type="button" onClick={startStreamingMidi} className="button" disabled={isRunning}>Start</button> 
			<button type="button" onClick={stopRealTime} className="button" disabled={!isRunning}>Stop</button>
		</form>
		<p id="message" className="message" style={{ display: 'none' }}></p>
		</div>
  	);
};

export default RealtimeForm;
