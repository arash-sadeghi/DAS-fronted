import React, { useEffect, useState } from 'react';


const RealtimeForm = () => {
    const [midiPorts, setMidiPorts] = useState([]);
    
    useEffect(() => {
        // const fetchMIDIPorts = async () => {
		// 	try {
		// 		console.log('yay');
		// 		const access = await navigator.requestMIDIAccess();
		// 		console.log('yay2');
		// 		const inputs = access.inputs.values();
		// 		const ports = [];
		
		// 		for (let input of inputs) {
		// 		ports.push(input.name); // Collect MIDI input port names
		// 		}
		
		// 		setMidiPorts(ports);
		// 	} catch (err) {
		// 		console.log('axiiiii');
		// 		console.error('Error accessing MIDI ports:', err);
		// 	}
		// };
    
        // fetchMIDIPorts();

		const listenToMIDIDevices = () => {
			if (navigator.requestMIDIAccess) {
				navigator.requestMIDIAccess().then((access) => {
				console.log('midi access granted');
				const inputs = access.inputs.values();
				const ports = [];
				for (let input of inputs) {
					ports.push(input.name); // Collect MIDI input port names
					console.log(">",input);
				}
			}).catch((err) => {
					console.error('MIDI access request failed:', err);
					console.log('MIDI access request failed');
				});
			} else {
				console.log('Web MIDI API is not supported by this browser.');
			}
		}
		listenToMIDIDevices();

	}, []);
    const [isRunning, setIsRunning] = useState(false);

	const startRealTime = () => {
        setIsRunning(true);
        document.getElementById('message').style.display = 'block';
        document.getElementById('message').innerHTML = 'Real-time processing started!';
    };

	const stopRealTime = () => {
		setIsRunning(false);
		document.getElementById('message').style.display = 'block';
		document.getElementById('message').innerHTML = 'Real-time processing stopped!';
	};

 	return (
		<div className="tab-content">
		<h1>Real-time</h1>
		<form id="realtime-form">
			<div>
				<select name="midiin" id="midiin" required>
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
			<button type="button" onClick={startRealTime} className="button" disabled={isRunning}>Start</button>
			<button type="button" onClick={stopRealTime} className="button" disabled={!isRunning}>Stop</button>
		</form>
		<p id="message" className="message" style={{ display: 'none' }}></p>
		</div>
  );
};

export default RealtimeForm;
