import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT } from "../config";

export type SendMessageBody = {
  message: string;
};

export async function user(userId: number) {
  const _user = express();
  _user.use(express.json());
  _user.use(bodyParser.json());

  // Store the last received message and last sent message
  let lastReceivedMessage: string | null = null;
  let lastSentMessage: string | null = null;

  // /status route
  _user.get("/status", (req, res) => {
    res.send("live");
  });

  // /getLastReceivedMessage route to retrieve last received message
  _user.get("/getLastReceivedMessage", (req, res) => {
    res.json({ result: lastReceivedMessage });
  });

  // /getLastSentMessage route to retrieve last sent message
  _user.get("/getLastSentMessage", (req, res) => {
    res.json({ result: lastSentMessage });
  });

  // Add a route to send messages (this will be used by your test or UI)
  _user.post("/sendMessage", (req, res) => {
    const { message, destination } = req.body;
    // Store the sent message
    lastSentMessage = message;
    
    // Your logic to actually send the message through the onion network would go here
    
    res.status(200).json({ success: true });
  });

  // /message route to receive messages
  _user.post("/message", (req, res) => {
    const { message }: SendMessageBody = req.body;
    // Store the received message
    lastReceivedMessage = message;
    // Respond to the client
    res.status(200).json({ message: "Message received successfully" });
  });

  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(`User ${userId} is listening on port ${BASE_USER_PORT + userId}`);
  });

  return server;
}