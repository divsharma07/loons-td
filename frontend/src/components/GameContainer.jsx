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
    const socketRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [gameStarted, setGameStarted] = useState(false);
    const phaserEl = useRef(null);

    // callback event that lets server know that a loon is popped
    // check handleBulletLoonCollision in Turret.js for usage

    const startGame = () => {
        // Start the game logic
        setGameStarted(true);
    };

    const email = 'sharmadivyanshu1996@gmail.com'; // Replace with your email
    // const serverUrl = `wss://pronto-challenge.ngrok.app/${email}/ws`;
    const serverUrl = 'ws://localhost:8000/ws/loonsLocation/'


    useEffect(() => {
        // setGame(game);

        if (phaserEl.current && game.canvas) {
            phaserEl.current.appendChild(game.canvas);
        }
        const resizeGame = () => {
            game.scale.resize(window.innerWidth, window.innerHeight);
        };


        window.addEventListener('resize', resizeGame);
        let newSocket;

        const handleLoonUpdate = (loonStateUpdate) => {
            // for (const [id, eachLoon] of Object.entries(loonStateUpdate.loonState)) {
            //     const scene = game.scene.getScene('Game');
            //     if (scene !== null) {
            //         scene.updateBalloonPosition(eachLoon);
            //     }
            // }

            const scene = game.scene.getScene('Game');
            if (scene && loonStateUpdate.loonState) {
                scene.processLoonUpdates(loonStateUpdate.loonState);
            }
        }
        // const closeSocket = () => {
        //     if (newSocket && newSocket.connected()) {
        //         newSocket.disconnect();
        //     }
        // };
        // window.addEventListener('beforeunload', closeSocket);

        if (gameStarted) {
            game.events.on(popLoonKey, (loonId) => {
                popLoon(loonId);
            });
            const primaryScene = game.scene.getScene('Game');
            if (primaryScene !== null) {
                primaryScene.startGame();
            }

            // reusuing the socket conneciton if available
            if (socketRef.current) {
                newSocket = socketRef.current;
            } else {
                newSocket = new WebSocketService(serverUrl);
            }
            socketRef.current = newSocket;

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
            function popLoon(loonId) {
                const message = JSON.stringify({
                    'publish': {
                        'popLoon': {
                            'loonId': loonId
                        }
                    }
                });
                console.log(`baloon ${loonId} is shot`)
                if (socketRef.current) {
                    socketRef.current.sendMessage(message);
                }
            };
        }


        return () => {
            window.removeEventListener('resize', resizeGame);
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        }
    }, [serverUrl, gameStarted, phaserEl]);



    return <div id="phaser-container" ref={phaserEl} style={{ position: 'relative', width: '100%', height: '100%' }}>
        {!gameStarted && <StartButton onStart={startGame} />}
    </div>;
}

export default GameContainer;