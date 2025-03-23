import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";
import crypto from "crypto";

export type Node = { nodeId: number; pubKey: string };

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Node[];
};

let nodeRegistry: Node[] = [];

export async function launchRegistry() {
  const _registry = express();
  _registry.use(express.json());
  _registry.use(bodyParser.json());

  // /status route
  _registry.get("/status", (req: Request, res: Response) => {
    res.send("live");
  });

  // Route to register a node
  _registry.post("/registerNode", (req: Request, res: Response) => {
    const { nodeId, pubKey }: RegisterNodeBody = req.body;
    
    // Check if node already exists
    const existingNode = nodeRegistry.find((node) => node.nodeId === nodeId);
    if (existingNode) {
      return res.status(400).json({ error: "Node already registered" });
    }
  
    // Add the new node to the registry
    nodeRegistry.push({ nodeId, pubKey });
    return res.status(200).json({ message: "Node registered successfully" });
  });

  // Route to get the node registry
  _registry.get("/getNodeRegistry", (req: Request, res: Response) => {
    res.json({ nodes: nodeRegistry });
  });

  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`Registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}
