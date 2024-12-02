const getTime = () =>{
    const now = new Date();
    return now.getTime()/1000;
}

let batchCounter = 0;

export const processResultMidiQueue = async (dependencies) => {
    if (dependencies.midiMessageQueue.current.length > 0 && !dependencies.isPublishinggMidi.current) {
        const data = dependencies.midiMessageQueue.current.shift(); 
        await PublishResultMidi(data , dependencies); 
    } else {
        console.log("publishing in progress or midi data queue is empty")
    }
};

const PublishResultMidi = async (data , dependencies) => {
    dependencies.isPublishinggMidi.current = true
    let access = dependencies.midiAccessRef.current;
    let selectedPortOutFromRef =  dependencies.selectedPortOutRef.current
    if (!selectedPortOutFromRef || !access) {
      console.log('[MIDI PUBLISHER] No MIDI output port selected',dependencies.selectedPortOutFromRef , dependencies.midiAccess , dependencies.midiPorts  , "ref", dependencies.midiAccessRef.current);
      return;
    }
    const selectedOutputPort = access.outputs.get(selectedPortOutFromRef);

    if (!selectedOutputPort) {
      console.error('Selected MIDI output port not found');
      return;
    }

    batchCounter ++;

    try {
        const start = getTime();
        let messageCounter = 0;
        const sendNextMessage = () => {
            if (messageCounter >= data.length) {
                console.log("----------  publishing batch finished");
                dependencies.isPublishinggMidi.current = false
                processResultMidiQueue(dependencies);
                return;  // All messages have been sent
            }
    
            const passedTime = getTime() - start;
            const message = data[messageCounter];
    
            if (message.time - passedTime <= 0.001) {
                messageCounter++;
                const midiMessage = [
                    message.type === 'note_on' ? 0x90+ (dependencies.selectedChannelOutRef.current - 1) : 0x80+ (dependencies.selectedChannelOutRef.current - 1), // Note On or Note Off
                    message.note,
                    message.velocity,
                ];
                console.log('Publishing MIDI message. BATCH',batchCounter, midiMessage, 'to MIDI ports:', selectedPortOutFromRef, "channel", dependencies.selectedChannelOutRef);
                selectedOutputPort.send(midiMessage);
                dependencies.addDrumMessage(JSON.stringify("Generate Drum Midi: " + midiMessage))
            }
    
            // Schedule the next message send attempt
            setTimeout(sendNextMessage, 1);  // Adjust the interval if needed
        };
    
        // Start sending the first message
        sendNextMessage();

    } catch (error) {
      console.error('[-] Error handling incoming MIDI message:', error);
    }
  };
