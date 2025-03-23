import bodyParser from "body-parser";
import express from "express";
import { BASE_ONION_ROUTER_PORT } from "../config";
import crypto from "crypto";
import http from "http";  // Import built-in HTTP module

export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  // /status route
  onionRouter.get("/status", (req, res) => {
    res.send("live");
  });

  // Generate a pair of keys
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });

  // Variables to keep track of received messages and destinations
  let lastReceivedEncryptedMessage: string | null = null;
  let lastReceivedDecryptedMessage: string | null = null;
  let lastMessageDestination: number | null = null;

  // /getLastReceivedEncryptedMessage route
  onionRouter.get("/getLastReceivedEncryptedMessage", (req, res) => {
    res.json({ result: lastReceivedEncryptedMessage });
  });

  // /getLastReceivedDecryptedMessage route
  onionRouter.get("/getLastReceivedDecryptedMessage", (req, res) => {
    res.json({ result: lastReceivedDecryptedMessage });
  });

  // /getLastMessageDestination route
  onionRouter.get("/getLastMessageDestination", (req, res) => {
    res.json({ result: lastMessageDestination });
  });

  // /getPrivateKey route
  onionRouter.get("/getPrivateKey", (req, res) => {
    const privateKeyBase64 = privateKey.export({ type: "pkcs1", format: "pem" }).toString("base64");
    res.json({ result: privateKeyBase64 });
  });

  // Register node with the registry (without using axios)
  const registryHost = "localhost";  // Update with the correct registry host if needed
  const registryPort = 8080;  // Assuming the registry is running on port 8080
  const registerData = JSON.stringify({
    nodeId,
    pubKey: publicKey.export({ type: "spki", format: "pem" }).toString("base64"),
  });

  const options = {
    hostname: registryHost,
    port: registryPort,
    path: "/registerNode",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(registerData),
    },
  };

  const request = http.request(options, (response) => {
    console.log("Node registered on the registry");
    // You can also handle the response here if needed
  });

  request.on("error", (error) => {
    console.error("Error registering node:", error);
  });

  request.write(registerData);
  request.end();

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${
        BASE_ONION_ROUTER_PORT + nodeId
      }`
    );
  });

  return server;
}
