// Function to extract the MIDI channel
const getMidiChannel = (statusByte) => {
    const channel = statusByte & 0x0F; // Extract the last 4 bits
    return channel + 1; // Convert to 1-indexed channel
};

export const sendMidi2Backend = async (dependencies) => {
    dependencies.setIsRunning(true);
    document.getElementById('message').style.display = 'block';
    document.getElementById('message').innerHTML = 'Real-time processing started!';

    // setSelectedPortOut(outputs.length > 0 ? outputs[0]?.name : '');
    // setSelectedPortIn(outputs.length >= 0 ? outputs[0]?.name : '');
    let portIn = null;
    if(dependencies.selectedPortIn === ''){ //! this mean onChange has not triggered for this slection and I will initilize it with first value of options
        portIn =  dependencies.midiPorts.length >= 0 ? dependencies.midiPorts[0].name : '';
        dependencies.setSelectedPortIn(portIn);
    } else{
        portIn = dependencies.selectedPortIn;
    }

    console.log("streaming: ",dependencies.selectedPortIn , portIn , "channel" , dependencies.selectedChannelIn)
    if (portIn) {
        try {
        const selectedInput = Array.from(dependencies.midiAccess.inputs.values()).find(input => input.name === portIn);
        console.log(">>>>>>>>>>","portIn" ,portIn, "selectedInput" , selectedInput , "ports" , dependencies.midiPorts , 'access',dependencies.midiAccess, Array.from(dependencies.midiAccess.inputs.values()) )
        if (selectedInput ) {

            dependencies.socketState.send(JSON.stringify({action: 'Start'}));
            selectedInput.onmidimessage = (message) => {
                const data = Array.from(message.data);  // Convert MIDI message to array
                let channel = getMidiChannel(data[0]);
                if(channel != dependencies.selectedChannelIn){
                    // console.log('[-] recieved message is', channel,' not in desired chanel',dependencies.selectedChannel);
                    return;
                }
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
                    channel: channel,
                    note: data[1],
                    velocity: vel,
                    time: now.getTime() / 1000
                };
                // console.log('socket is emmiting to server')
                dependencies.socketState.send(JSON.stringify(midi_message));
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
}