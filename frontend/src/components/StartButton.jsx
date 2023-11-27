import React from 'react';

/**
 * StartButton component.
 *
 * @param {Object} props - The component props.
 * @param {Function} props.onStart - The function to be called when the button is clicked.
 * @returns {JSX.Element} The StartButton component.
 */
const StartButton = ({ onStart }) => {
    return (
        <button id="start-button" onClick={onStart} style={{ position: 'absolute', left: "40%", zIndex: 10 }}>
            Start Game
        </button>
    );
};

export default StartButton;