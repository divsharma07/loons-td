const email = 'sharmadivyanshu1996@gmail.com'; // Replace with your actual email
const serverUrl = `wss://pronto-challenge.ngrok.app/${email}/ws`;
const socket = new WebSocket(serverUrl);

// Connection opened
socket.addEventListener('open', function (event) {
    console.log('Connected to the server');

    // Subscribe to a topic (e.g., 'msg' or 'loonState')
    socket.send(JSON.stringify({ 'subscribe': 'msg' }));
});

// Listen for messages
socket.addEventListener('message', function (event) {
    console.log('Message from server ', event.data);

    // Here you can handle incoming messages and update your game state accordingly
});

// Sending a message to pop a 'Loon
function popLoon(loonId) {
    socket.send(JSON.stringify({
        'publish': {
            'popLoon': {
                'loonId': loonId
            }
        }
    }));
}
