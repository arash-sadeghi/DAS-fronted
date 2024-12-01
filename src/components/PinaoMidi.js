import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { processResultMidiQueue } from '../utils/PublishResultMidi';
import {sendPiano2backend} from '../utils/SendPiano2backend';
import SelectMidiChannelIn from './MidiChannelIn'
import SelectMidiChannelOut from './MidiChannelOut'
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
import { Soundfont } from "smplr";

function PianoMidi(props) {
 	const {socket} = props;
 	const firstNote = MidiNumbers.fromNote('c2');
	const lastNote = MidiNumbers.fromNote('c4');
	const keyboardShortcuts = KeyboardShortcuts.create({
	  firstNote: firstNote,
	  lastNote: lastNote,
	  keyboardConfig: KeyboardShortcuts.HOME_ROW,
	});
	const context = new AudioContext();
	const bass = new Soundfont(context, { instrument: "electric_bass_pick" });

	useEffect(() => {
		console.log("child used effect",socket);
		if (!socket){
			console.error("Socket is not available yet");
			return;
		}	
		socket.send(JSON.stringify({action: 'Start'}));
	  }, [socket]);
   
	return (
	  <Piano
		noteRange={{ first: firstNote, last: lastNote }}
		playNote={(midiNumber) => {
		  // Play a given note - see notes below
			console.log("playNote" , midiNumber)
			bass.start({ note: midiNumber, velocity: 127 });
			sendPiano2backend(midiNumber , socket);

		}}
		stopNote={(midiNumber) => {
		  // Stop playing a given note - see notes below
			console.log("stopNote" , midiNumber)
		}}
		width={1000}
		keyboardShortcuts={keyboardShortcuts}
	  />
	);
  }
export default PianoMidi;
