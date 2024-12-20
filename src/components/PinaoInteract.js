import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { processResultMidiQueue } from '../utils/PublishResultMidi';
import SelectMidiChannel from './MidiChannel'
import 'react-piano/dist/styles.css';
import PianoMidi from './PinaoMidi';

const PianoInteract = () => {
    const [midiPorts, setMidiPorts] = useState([]);
    const [selectedPortIn, setSelectedPortIn] = useState('');
    const [selectedPortOut, setSelectedPortOut] = useState('');
	const [isRunning, setIsRunning] = useState(false);
	const [socketState, setSocketState] = useState(null);
	const socketStateRef = useRef(null);
	const [midiAccess, setMidiAccess] = useState(null);

	const [selectedChannelIn, setSelectedChannelIn] = useState(3);
	const [selectedChannelOut, setSelectedChannelOut] = useState(10);
	const selectedChannelInRef = useRef(3)
	const selectedChannelOutRef = useRef(10)

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
		'selectedChannelOutRef' : selectedChannelOutRef,
	};
	const sendMidi2BackendDependencies = {
		'setIsRunning' : setIsRunning ,
		'selectedPortIn' : selectedPortIn ,
		'setSelectedPortIn' : setSelectedPortIn ,
		'midiAccess' : midiAccess ,
		'midiPorts' : midiPorts ,
		'socketState' : socketState ,
		'selectedChannelInRef' : selectedChannelInRef,
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
		socketStateRef.current = socket;
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

 	return (
		<div className="tab-content">
		<h1>Piano Interact</h1>
		<p>Recommended browser is Chrome and recommended OS is OSX</p>
		<PianoMidi socket = {socketStateRef.current} id = "piano"/>
		<form id="realtime-form">
			<div className='selection-segment'>	
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
				<SelectMidiChannel onChannelChange={handleChannelChangeOut} />
			</div>
		</form>
		<p id="message" className="message" style={{ display: 'none' }}></p>
		</div>
  	);
};



export default PianoInteract;
