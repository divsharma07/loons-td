import React, { useEffect, useState, useRef } from "react";
import WebSocketService from "../services/WebSocketService";
import StartButton from "./StartButton";
import Phaser from "phaser";
import Game from "../game/entities/Game";

const gameHeight = 600;
const gameWidth = 1275;
const popLoonKey = 'popLoon'
const scoreUpdateKey = 'scoreUpdate'
const coinUpdateKey = 'coinUpdate'
const gameOverString = 'Game Over'

const config = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    pixelArt: true,
    roundPixels: true,
    scene: [
        Game
    ],
    antialias: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Example gravity setting
            debug: false // Set to true to see physics debugging visuals
        }
    },
};
// configuring loon popping event
const game = new Phaser.Game(config);

const GameContainer = ({ onRestart }) => {
    const socketRef = useRef(null);
    const [gameStarted, setGameStarted] = useState(false);
    // const abortController = useRef(new AbortController());


    // const email = 'sharmadivyanshu1996@gmail.com'; // Replace with your email
    // const serverUrl = `wss://pronto-challenge.ngrok.app/${email}/ws`;
    // const serverUrl = `ws://localhost:8000/ws/loonsLocation/${playerId}`

    const startGame = () => {
        // kicks off useEffect
        setGameStarted(true);
    };


    useEffect(() => {
        // Create a new game instance
        // const game = gameRef.current;
        if (gameStarted) {
            // fetching game config
            const fetchDataAndStartGame = async () => {
                try {
                    const response = (await fetch('http://localhost:8000/game/start/'));


                    if (!response.ok) {
                        setGameStarted(false);
                    }
                    const data = await response.json();
                    // we only subscribe to the websocket server and do all the tasks if the call succeeds
                    const playerId = data.player_id;
                    const initialCoins = data.game_config.game_settings.initial_coins;
                    const inventory = data.game_config.game_settings.inventory;
                    const primaryScene = game.scene.getScene('Game');

                    // if (gameEnded) {
                    //     game.events.emit('reloadGame');
                    // }
                    if (primaryScene !== null) {
                        try {
                            game.events.emit('startGame', playerId, initialCoins, inventory);
                            // primaryScene.startGame(playerId, initialCoins,
                            //     inventory);
                        }
                        catch (e) {
                            console.error('Error starting game:', e);
                        }
                    }
                    // setting up event listener for popping loons
                    game.events.on(popLoonKey, (loonId, playerId) => {
                        popLoon(loonId, playerId);
                    });

                    const endGame = (coins, score) => {

                        if (socketRef.current) {
                            socketRef.current.disconnect();
                            socketRef.current = null;
                        }
                        const primaryScene = game.scene.getScene('Game');
                        primaryScene?.endGame(coins, score);
                        setGameStarted(false);
                    }

                    // callback event that lets server know that a loon is popped
                    // check handleBulletLoonCollision in Turret.js for usage
                    const popLoon = (loonId, bulletLevel, loonLevel, playerId) => {
                        const message = JSON.stringify({
                            'action': "popLoon",
                            'loonId': loonId,
                            'itemLevel': bulletLevel,
                            'loonLevel': loonLevel,
                            'playerId': playerId
                        });
                        // console.log(`baloon ${loonId} is shot`)
                        if (socketRef.current) {
                            socketRef.current.sendMessage(message);
                        }
                    };
                    const serverUrl = `ws://localhost:8000/ws/loonsLocation/${playerId}/`

                    // reusuing the socket conneciton if available

                    let newSocket = new WebSocketService(serverUrl);

                    socketRef.current = newSocket;

                    const handleLoonUpdate = (loonStateUpdate) => {
                        const scene = game.scene.getScene('Game');
                        if (scene && loonStateUpdate.loonState) {
                            scene.processLoonUpdates(loonStateUpdate.loonState);
                        }
                    }
                    newSocket.connectAndSubscribe((event) => {
                        if (event.data) {
                            const newMessage = JSON.parse(event.data);
                            // loon state message comes at the highest frequency and tells the position and loon values
                            if (newMessage.loonState) {
                                // console.log(newMessage);
                                handleLoonUpdate(newMessage);
                            }
                            // update messages are less frequent but notify the frontend about any changes in score or coins 
                            // or other user attributes  
                            else if (newMessage.update) {
                                // received score update from server and sent to GamePanel
                                let update = newMessage.update
                                if (update.score) {
                                    game.events.emit(scoreUpdateKey, update.score);
                                }
                                if (update.coins) {
                                    game.events.emit(coinUpdateKey, update.coins);
                                }
                                game.events.emit()
                            }
                            // any game state related events like game being over 
                            else if (newMessage.msg) {
                                if (newMessage.msg === gameOverString) {
                                    endGame(newMessage.coins, newMessage.score);
                                }
                            }
                        }
                    });
                } catch (error) {
                    setGameStarted(false);
                    console.error('Failed to fetch game data:', error);
                }

            }
            fetchDataAndStartGame();



            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
            }
        }
    }, [gameStarted]);



    return <div id="phaser-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
        {!gameStarted && <StartButton onStart={startGame} />}
        {/* {gameEnded && <RestartButton onRestart={restartGame} />} */}
    </div>;
}

export default GameContainer;