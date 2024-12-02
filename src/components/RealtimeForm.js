import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { processResultMidiQueue } from '../utils/PublishResultMidi';
import {sendMidi2Backend} from '../utils/SendMidi2Backend';
import SelectMidiChannelIn from './MidiChannelIn'
import SelectMidiChannelOut from './MidiChannelOut'
import LogViewerBassReceive from "./LogViewerBassReceive";

const RealtimeForm = () => {
	const meesageLogLimit = 10;
    const [midiPorts, setMidiPorts] = useState([]);
    const [selectedPortIn, setSelectedPortIn] = useState('');
    const [selectedPortOut, setSelectedPortOut] = useState('');
	const [isRunning, setIsRunning] = useState(false);
	const [socketState, setSocketState] = useState(null);
	const [midiAccess, setMidiAccess] = useState(null);
	const [bassMessages, setBassMessages] = useState(['Waiting for start button to listen to user MIDI...']);
	const [drumMessages, setDrumMessages] = useState(['Waiting for start button to make drum for you...']);
	const drumMessagesRef = useRef(drumMessages);

	const [selectedChannelIn, setSelectedChannelIn] = useState(3);
	const [selectedChannelOut, setSelectedChannelOut] = useState(10);
	const selectedChannelInRef = useRef(3)
	const selectedChannelOutRef = useRef(10)

	const midiAccessRef = useRef(null);  
	const selectedPortOutRef = useRef(null);

    const midiMessageQueue = useRef([]); // **Added queue**
	const isPublishinggMidi = useRef(false); // **Added queue**
    // Process incoming MIDI messages from the queue asynchronously

	const addBassMessage = (newMessage) => {
		setBassMessages((prevMessages) => {
			// Add the new message and ensure the log size doesn't exceed 100
			const updatedMessages = [...prevMessages, newMessage];
			if (updatedMessages.length > meesageLogLimit) {
			  updatedMessages.shift(); // Remove the oldest message
			}
			return updatedMessages;
		  });		
	};
	const addDrumMessage = (newMessage) => {
		setDrumMessages((prevMessages) => {
			// Add the new message and ensure the log size doesn't exceed 100
			const updatedMessages = [...prevMessages, newMessage];
			if (updatedMessages.length > meesageLogLimit) {
			  updatedMessages.shift(); // Remove the oldest message
			}
			drumMessagesRef.current  = updatedMessages 
			return updatedMessages;
		  });
		console.log('drum message:' , drumMessages , newMessage , drumMessagesRef.current)
	};

	const midiPublishDependencies = {
		'isPublishinggMidi': isPublishinggMidi,
		'midiAccessRef' : midiAccessRef,
		'selectedPortOutRef' : selectedPortOutRef,
		'midiAccess' : midiAccess,
		'midiPorts' : midiPorts,
		'midiAccessRef' : midiAccessRef,
		'midiMessageQueue' : midiMessageQueue,	  
		'selectedChannelOutRef' : selectedChannelOutRef,
		'addDrumMessage': addDrumMessage,
	};
	const sendMidi2BackendDependencies = {
		'setIsRunning' : setIsRunning ,
		'selectedPortIn' : selectedPortIn ,
		'setSelectedPortIn' : setSelectedPortIn ,
		'midiAccess' : midiAccess ,
		'midiPorts' : midiPorts ,
		'socketState' : socketState ,
		'selectedChannelInRef' : selectedChannelInRef,
		'addBassMessage':addBassMessage,
	};
	

	const handleChannelChangeIn = (channel) => {
	  setSelectedChannelIn(channel);
	  selectedChannelInRef.current = channel;
	  console.log("Selected MIDI Channel:", channel);
	};

	const handleChannelChangeOut = (channel) => {
		setSelectedChannelOut(channel);
		selectedChannelOutRef.current = channel;
		console.log("Selected MIDI Channel:", channel);
	};

	useEffect(() => {
		console.log('refreshing ws' , midiAccess)
		const socket = io(process.env.REACT_APP_BACKEND_URL+'/realtime');
		setSocketState(socket);
		socket.on('connect', () => {
			console.log('connected to ',process.env.REACT_APP_BACKEND_URL);
			addDrumMessage('Connected to DAS server')
		});

		socket.on('drum_midi', (data) => {
			console.log("xxxxxxxxx message recieved from server")
			midiMessageQueue.current.push(data); // **Enqueue the data**
			processResultMidiQueue(midiPublishDependencies); // **Start processing the queue**
		});

		socket.on('server_status', (data) => {
				let message = data.status +":"+ data.message;
				if (drumMessagesRef.current[drumMessagesRef.current.length-1] !== message) // to avoid repeated messages
					addDrumMessage(message);

		});

		socket.on('disconnect', () => {
			addDrumMessage("server disconnected");
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

	const startRealtime = async () => {
		sendMidi2Backend(sendMidi2BackendDependencies);
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
			<div className="selection-segment">
				<div className="controls">
					<label>MIDI Input Port:</label>
					<select
					name="midiin"
					id="midiin"
					onChange={handlePortChangeIn}
					value={selectedPortIn}
					required
					>
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
					<SelectMidiChannelIn onChannelChange={handleChannelChangeIn} />
				</div>
				<div className="log-container">
					<LogViewerBassReceive messages={bassMessages} />
				</div>
			</div>

			<div className='selection-segment'>	
				<div className='controls'>
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
				<SelectMidiChannelOut onChannelChange={handleChannelChangeOut} />
				</div>
				<div className="log-container">
					<LogViewerBassReceive messages={drumMessages} />
				</div>
			</div>

			<div id='start-stop-buttons'>
				<button type="button" onClick={startRealtime} className="button" disabled={isRunning}>Start</button> 
				<button type="button" onClick={stopRealTime} className="button" disabled={!isRunning}>Stop</button>
			</div>
		</form>
		<p id="message" className="message" style={{ display: 'none' }}></p>
		</div>
  	);
};

export default RealtimeForm;
