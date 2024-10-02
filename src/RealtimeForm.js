import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';


const RealtimeForm = () => {
    const [midiPorts, setMidiPorts] = useState([]);
    const [selectedPortIn, setSelectedPortIn] = useState('');
    const [selectedPortOut, setSelectedPortOut] = useState('');
	const [isRunning, setIsRunning] = useState(false);
	const [socketState, setSocketState] = useState(null);
	const [midiAccess, setMidiAccess] = useState(null);

	const midiAccessRef = useRef(null);  

  useEffect(() => {
	console.log('refreshing ws' , midiAccess)
    const socket = io(process.env.REACT_APP_BACKEND_URL);
    setSocketState(socket);
    socket.on('connect', () => {
        console.log('connected to ',process.env.REACT_APP_BACKEND_URL);
    });

	socket.on('message', (data) => {
      handleIncomingMidiMessage(data);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);


  useEffect( ()=>{
	console.log('refreshing midi' , midiAccess)
	const initMIDI = async () => {
		try {
		  const access = await navigator.requestMIDIAccess();
		  setMidiAccess(access);
		  midiAccessRef.current = access; 
		  const outputs = Array.from(access.outputs.values());
		  setMidiPorts(outputs);
		  // setSelectedPortOut(outputs.length > 0 ? outputs[0].id : '');
  
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
  },[]);


	const handlePortChangeOut = (e) => {
		setSelectedPortOut(e.target.value);
	};

	const handlePortChangeIn = (e) => {
		setSelectedPortIn(e.target.value);
	};

	const handleIncomingMidiMessage = (data) => {
		if (!selectedPortOut || !midiAccess) {
		  console.log('No MIDI output port selected',selectedPortOut , midiAccess , midiPorts  , "ref", midiAccessRef.current);
		  return;
		}
		console.log('YYEEEEESSS MIDI output port selected',selectedPortOut , midiAccess, "ref", midiAccessRef.current);
		return
	
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

	// const startPublishingMidi = async (data , midiPorts) => {
	// 		console.log("xx<<<<<<<<<<<","selectedPortOut" ,selectedPortOut , "ports" , midiPorts , "midiAccess", midiAccess)
	// 		if (selectedPortOut) {
	// 			const selectedOutputPORT = Array.from(midiAccess.outputs.values()).find(output => output.name === selectedPortOut);
	// 			try {
	// 				const midiMessages = JSON.parse(data);
					
	// 				  midiMessages.forEach(message => {
	// 					const midiMessage = [
	// 					  message.type === 'note_on' ? 0x90 : 0x80, // Note On or Note Off
	// 					  message.note,
	// 					  message.velocity,
	// 					];
	// 					console.log('Sending MIDI message:', midiMessage);
	// 					selectedOutputPORT.send(midiMessage); // Send MIDI message
	// 				  });
	// 			  } catch (error) {
	// 				console.error('Error parsing MIDI messages:', error);
	// 			  }
	// 		}else {
	// 			console.error('Selected MIDI out port not found');
	// 		}
	// }


	const startStreamingMidi = async () => {
		setIsRunning(true);
		document.getElementById('message').style.display = 'block';
		document.getElementById('message').innerHTML = 'Real-time processing started!';

		if (selectedPortIn) {
			try {
			console.log("streaming: ",selectedPortIn)

			const selectedInput = Array.from(midiAccess.inputs.values()).find(input => input.name === selectedPortIn);
			console.log(">>>>>>>>>>","selectedPortIn" ,selectedPortIn, "selectedInput" , selectedInput , "ports" , midiPorts)
			
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
