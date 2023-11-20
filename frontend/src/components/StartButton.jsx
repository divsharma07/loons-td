import React from 'react';

const StartButton = ({ onStart }) => {
    return (
        <button onClick={onStart} style={{ position: 'absolute', left: "45%", zIndex: 10 }}>
            Start Game
        </button>
    );
};

export default StartButton;