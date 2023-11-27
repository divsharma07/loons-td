import React, { useEffect, useState, useRef } from "react";
import WebSocketService from "../services/WebSocketService";
import Position from "../game/entities/Position";
import Loon from "../game/entities/Loon";
import StartButton from "./StartButton";
import Phaser from "phaser";
import Game from "../game/entities/Game";

const gameHeight = 625;
const gameWidth = 1200;
const popLoonKey = 'popLoon'
const scoreUpdateKey = 'scoreUpdate'
const coinUpdateKey = 'coinUpdate'

const config = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    pixelArt: true,
    roundPixels: true,
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
    const [gameStarted, setGameStarted] = useState(false);
    const phaserEl = useRef(null);
    const [playerId, setPlayerId] = useState(null);
    const [initialCoins, setInitialCoins] = useState(null);
    const [inventory, setInventory] = useState(null);

    // const email = 'sharmadivyanshu1996@gmail.com'; // Replace with your email
    // const serverUrl = `wss://pronto-challenge.ngrok.app/${email}/ws`;
    // const serverUrl = `ws://localhost:8000/ws/loonsLocation/${playerId}`


    const startGame = () => {
        // Start the game logic
        setGameStarted(true);
    };

    useEffect(() => {
        if (phaserEl.current && game.canvas) {
            phaserEl.current.appendChild(game.canvas);
        }
        const resizeGame = () => {
            game.scale.resize(window.innerWidth, window.innerHeight);
        };


        window.addEventListener('resize', resizeGame);
        let newSocket;

        const handleLoonUpdate = (loonStateUpdate) => {
            const scene = game.scene.getScene('Game');
            if (scene && loonStateUpdate.loonState) {
                scene.processLoonUpdates(loonStateUpdate.loonState);
            }
        }


        if (gameStarted) {
            // fetching game config
            fetch('http://localhost:8000/game/start')
                .then(response => response.json())
                .then(data => {
                    // we only subscribe to the websocket server and do all the tasks if the call succeeds
                    setPlayerId(data.player_id);
                    setInitialCoins(data.game_config.game_settings.initial_coins);
                    setInventory(data.game_config.game_settings.inventory);
                    const primaryScene = game.scene.getScene('Game');
                    if (primaryScene !== null) {
                        primaryScene.startGame(data.player_id, data.game_config.game_settings.initial_coins, 
                            data.game_config.game_settings.inventory);
                    }
                    console.log(data.player_id);
                    // setting up event listener for popping loons
                    game.events.on(popLoonKey, (loonId, playerId) => {
                        popLoon(loonId, playerId);
                    });


                    // callback event that lets server know that a loon is popped
                    // check handleBulletLoonCollision in Turret.js for usage
                    const popLoon = (loonId,bulletLevel, loonLevel, playerId) => {
                        const message = JSON.stringify({
                            'action': "popLoon",
                            'loonId': loonId,
                            'itemLevel': bulletLevel,
                            'loonLevel': loonLevel,
                            'playerId': playerId
                        });
                        console.log(`baloon ${loonId} is shot`)
                        if (socketRef.current) {
                            socketRef.current.sendMessage(message);
                        }
                    };
                    const serverUrl = `ws://localhost:8000/ws/loonsLocation/${data.player_id}/`

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
                            } else if (newMessage.update) {
                                // received score update from server and sent to GamePanel
                                let update = newMessage.update
                                if(update.score) {
                                    game.events.emit(scoreUpdateKey, update.score); 
                                }
                                if(update.coins) {
                                    game.events.emit(coinUpdateKey, update.coins); 
                                }
                                game.events.emit()
                            } else if (newMessage.msg){

                            }
                        }
                    });
                })
                .catch(error => console.error('Error:', error));
        }


        return () => {
            window.removeEventListener('resize', resizeGame);
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        }
    }, [gameStarted, phaserEl]);



    return <div id="phaser-container" ref={phaserEl} style={{ position: 'relative', width: '100%', height: '100%' }}>
        {!gameStarted && <StartButton onStart={startGame} />}
    </div>;
}

export default GameContainer;