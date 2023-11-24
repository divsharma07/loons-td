import React, { useEffect, useState, useRef } from "react";
import WebSocketService from "../services/WebSocketService";
import Position from "../game/entities/Position";
import Loon from "../game/entities/Loon";
import StartButton from "./StartButton";
import Phaser from "phaser";
import Game from "../game/entities/Game";

const gameHeight = 500;
const gameWidth = 500;
const popLoonKey = 'popLoon'
const config = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    scene: [
        Game
    ],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Example gravity setting
            debug: false // Set to true to see physics debugging visuals
        }
    },
};

const game = new Phaser.Game(config);
// configuring loon popping event


const GameContainer = () => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [gameStarted, setGameStarted] = useState(false);
    let loonsMap = new Map();
    const phaserEl = useRef(null);

    game.events.on(popLoonKey, popLoon);




    const startGame = () => {
        // Start the game logic
        setGameStarted(true);
    };

    const email = 'sharmadivyanshu1996@gmail.com'; // Replace with your email
    const serverUrl = `wss://pronto-challenge.ngrok.app/${email}/ws`;

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

            const scene = game.scene.getScene('Game');
            if (scene !== null) {
                scene.updateBalloonPositions(loonsMap.get(id));
            }
        }
    }

    const clearLoons = () => {
        loonsMap.clear();
        const primaryScene = game.scene.getScene('Game');
        if (primaryScene !== null) {
            primaryScene.clearLoons();
        }
    }

    useEffect(() => {
        if (phaserEl.current && game.canvas) {
            phaserEl.current.appendChild(game.canvas);
        }
        const resizeGame = () => {
            game.scale.resize(window.innerWidth, window.innerHeight);
        };


        window.addEventListener('resize', resizeGame);
        let newSocket;
        // const closeSocket = () => {
        //     if (newSocket && newSocket.connected()) {
        //         newSocket.disconnect();
        //     }
        // };
        // window.addEventListener('beforeunload', closeSocket);

        if (gameStarted) {
            const primaryScene = game.scene.getScene('Game');
            if (primaryScene !== null) {
                primaryScene.startGame();
            }

            if(socket) {
                newSocket = socket;
            } else {
                newSocket = new WebSocketService(serverUrl);
            }
            setSocket(newSocket);
            newSocket.connectAndSubscribe((event) => {
                if (event.data) {
                    const newMessage = JSON.parse(event.data);
                    if (newMessage.loonState) {
                        console.log(newMessage);
                        handleLoonUpdate(newMessage);
                        setMessages((prevMessages) => [...prevMessages, newMessage]);
                    } else {
                        setMessages([]);
                        console.log("This wave is complete");
                    }
                }
            });
        }

        return () => {
           // closeSocket();
            window.removeEventListener('resize', resizeGame);
        }
    }, [serverUrl, gameStarted, phaserEl]);

    function popLoon(loonId) {
        const message = JSON.stringify({
            'publish': {
                'popLoon': {
                    'loonId': loonId
                }
            }
        });
        if(socket) {
            socket.sendMessage(message);
        }
    };


    return <div id="phaser-container" ref={phaserEl} style={{ position: 'relative', width: '100%', height: '100%' }}>
        {!gameStarted && <StartButton onStart={startGame} />}
    </div>;
}

export default GameContainer;