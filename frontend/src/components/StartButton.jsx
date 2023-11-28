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
        <button id="start-button" onClick={onStart} style={{
            position: 'fixed',
            top: '70vh',
            left: '50vw',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            padding: '10px 20px',
            fontSize: '20px',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: '#4CAF50',
            color: 'white',
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '0 9px #999'
        }}>
            Start Game
        </button>
    );
};

export default StartButton;