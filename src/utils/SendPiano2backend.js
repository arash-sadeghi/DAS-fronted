export const sendPiano2backend = async (pitch,socketState) => {
    const now = new Date();
    const midi_message={
        action: "Process",
        type:  'note_on',
        note: pitch,
        velocity: 127,
        time: now.getTime() / 1000
    };

    socketState.send(JSON.stringify(midi_message));

    setTimeout(function(){
        midi_message.type = 'note_off';
        midi_message.time += 0.5;
        socketState.send(JSON.stringify(midi_message));
    
    }, 500); //TODO assumption of fixed length pitch for piano

}