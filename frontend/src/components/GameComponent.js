import React, { useEffect, useState } from "react";
import WebSocketService from "../services/WebSocketService";
import Position from "../game/entities/Position";
import Loon from "../game/entities/Loon";

const GameComponent = () => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    let loonsMap = new Map();

    const email = 'sharmadivyanshu1996@gmail.com'; // Replace with your email
    const serverUrl = `wss://pronto-challenge.ngrok.app/${email}/ws`;

    useEffect(() => {
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
}

export default GameComponent;