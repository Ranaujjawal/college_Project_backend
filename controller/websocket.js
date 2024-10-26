import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Message } from '../model/chat.js';
import dotenv from 'dotenv'
dotenv.config()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (connection, req) => {

    function notifyAboutOnlinePeople() {
      [...wss.clients].forEach(client => {
        client.send(JSON.stringify({
          online: [...wss.clients].map(c => ({ userId: c.userId, email: c.email })),
        }));
      });
    }

    connection.isAlive = true;

    // Heartbeat mechanism for WebSocket connections
    connection.timer = setInterval(() => {
      connection.ping();
      connection.deathTimer = setTimeout(() => {
        connection.isAlive = false;
        clearInterval(connection.timer);
        connection.terminate();
        notifyAboutOnlinePeople();
        console.log('Connection closed due to inactivity.');
      }, 1000);
    }, 5000);

    connection.on('pong', () => {
      clearTimeout(connection.deathTimer);
    });

    // Read username and id from the cookie for this connection
    const cookies = req.headers.cookie;
    if (cookies) {
      const tokenCookieString = cookies.split(';').find(str => str.trim().startsWith('token='));
      if (tokenCookieString) {
        const token = tokenCookieString.split('=')[1];
        if (token) {
          jwt.verify(token, process.env.JWT_SECRET, (err, userData) => {
            if (err) throw err;
            const { userId, email } = userData;
            connection.userId = userId;
            connection.email = email;
            notifyAboutOnlinePeople(); // Notify others when user connects with valid token
          });
        }
      }
    }

    // Handle incoming messages
    connection.on('message', async (message) => {
      const messageData = JSON.parse(message.toString());
      const { recipient, text, file } = messageData;
      let filename = null;

      // Handle file upload if any
      if (file) {
        const parts = file.name.split('.');
        const ext = parts[parts.length - 1];
        filename = Date.now() + '.' + ext;
        const upath =  path.join(__dirname, '..', 'uploads', filename);
      //  const uploadPath = path.join(__dirname, '..', '/public/uploads/', filename);
      let bufferData;
    if (file && typeof file.data === 'string') {
        bufferData = Buffer.from(file.data, 'base64');
    } else {
        throw new TypeError('Unsupported data type');
    }

      // Now use bufferData as needed
      
    // Proceed with saving or handling the bufferData
    console.log('File processed successfully', bufferData);

      // Convert to buffer
        fs.writeFile(upath, bufferData, () => {
          console.log('File saved: ' + upath);
        });
      }

      // Create message document if recipient exists and there's a message or file
      if (recipient && (text || file)) {
        const messageDoc = await Message.create({
          sender: connection.userId,
          recipient,
          text,
          file: file ? filename : null,
        });
        console.log('Created message in DB');

        // Send message to the recipient
        [...wss.clients]
          .filter(c => c.userId === recipient)
          .forEach(c => c.send(JSON.stringify({
            text,
            sender: connection.userId,
            recipient,
            file: file ? filename : null,
            _id: messageDoc._id,
          })));
      }
    });

    notifyAboutOnlinePeople();
  });

  return wss;
};
