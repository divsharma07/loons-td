import React, { useEffect, useState, useRef } from "react";
import WebSocketService from "../services/WebSocketService";
import Position from "../game/entities/Position";
import Loon from "../game/entities/Loon";
import game from "../game/entities/Game";
import StartButton from "./StartButton";

const GameContainer = () => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [gameStarted, setGameStarted] = useState(false);
    let loonsMap = new Map();
    const phaserEl = useRef(null);

    const startGame = () => {
        // Start the game logic
        setGameStarted(true);
    };

    const email = 'sharmadivyanshu1996@gmail.com'; // Replace with your email
    const serverUrl = `wss://pronto-challenge.ngrok.app/${email}/ws`;

    useEffect(() => {
        if (phaserEl.current && game.canvas) {
            phaserEl.current.appendChild(game.canvas);
        }
        const resizeGame = () => {
            game.scale.resize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', resizeGame);
        const newSocket = new WebSocketService(serverUrl);
        setSocket(newSocket);
        newSocket.connectAndSubscribe((event) => {
            if (event.data) {
                const newMessage = JSON.parse(event.data);
                if (newMessage.msg) {
                    setMessages([]);
                    loonsMap.clear();
                    console.log("This wave is complete");
                } else if (newMessage.loonState) {
                    console.log(newMessage);
                    handleLoonUpdate(newMessage);
                    setMessages((prevMessages) => [...prevMessages, newMessage]);
                }
            }
        });

        return () => {
            newSocket.disconnect();
            window.removeEventListener('resize', resizeGame);
        }
    }, [serverUrl]);

    const handleLoonUpdate = (loonStateUpdate) => {
        for (const [id, eachLoon] of Object.entries(loonStateUpdate.loonState)) {

            if (loonsMap.has(id)) {
                // If the loon already exists, update it
                loonsMap.get(id).updatePosition(new Position(eachLoon.position_x, eachLoon.position_y));
            } else {
                // If the loon doesn't exist, create a new one and add it to the map
                const newLoon = new Loon(id, new Position(eachLoon.position_x, eachLoon.position_y));
                loonsMap.set(id, newLoon);
            }
        }

    }
    const popLoon = (loonId) => {
        const message = JSON.stringify({
            'publish': {
                'popLoon': {
                    'loonId': loonId
                }
            }
        });
        socket.sendMessage(message);
    };

    return <div id="phaser-container" ref={phaserEl} style={{ position: 'relative', width: '100%', height: '100%' }}>
        {!gameStarted && <StartButton onStart={startGame} />}
    </div>;
}

export default GameContainer;