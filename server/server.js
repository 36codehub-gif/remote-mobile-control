import "dotenv/config";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

const PORT = process.env.PORT || 8080;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const PAIR_TOKEN = process.env.PAIR_TOKEN;

const devices = new Map();

app.use(express.json());
app.use(express.static("../frontend"));

app.get("/api/devices", (req, res) => {
  if (req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json(
    [...devices.values()].map(d => ({
      deviceId: d.deviceId,
      name: d.name,
      online: d.ws.readyState === 1,
      lastSeen: d.lastSeen
    }))
  );
});

wss.on("connection", ws => {
  let deviceId = null;
  let dashboard = false;

  ws.on("message", raw => {
    let msg;

    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    // Android device registration
    if (msg.type === "register") {
      if (msg.pairToken !== PAIR_TOKEN || !msg.deviceId) {
        ws.close();
        return;
      }

      deviceId = String(msg.deviceId);

      devices.set(deviceId, {
        deviceId,
        name: String(msg.name || deviceId),
        ws,
        lastSeen: new Date().toISOString()
      });

      ws.send(JSON.stringify({
        type: "registered",
        deviceId
      }));

      return;
    }

    // Dashboard authentication
    if (msg.type === "dashboard_auth") {
      if (msg.adminToken !== ADMIN_TOKEN) {
        ws.close();
        return;
      }

      dashboard = true;

      ws.send(JSON.stringify({
        type: "dashboard_authenticated"
      }));

      return;
    }

    // Dashboard sends command to Android
    if (dashboard && msg.type === "command") {
      const device = devices.get(String(msg.deviceId));

      if (!device || device.ws.readyState !== 1) {
        ws.send(JSON.stringify({
          type: "command_result",
          ok: false,
          error: "Device offline"
        }));
        return;
      }

      const allowed = [
        "tap",
        "swipe",
        "back",
        "home"
      ];

      if (!allowed.includes(msg.command)) {
        return;
      }

      device.ws.send(JSON.stringify({
        type: "command",
        command: msg.command,
        x: Number(msg.x || 0),
        y: Number(msg.y || 0),
        x2: Number(msg.x2 || 0),
        y2: Number(msg.y2 || 0),
        duration: Number(msg.duration || 500)
      }));
    }
  });

  ws.on("close", () => {
    if (deviceId && devices.get(deviceId)?.ws === ws) {
      devices.delete(deviceId);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
