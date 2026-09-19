const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 8080;

const devices = new Map();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Remote Mobile Control Server is running");
});

app.get("/devices", (req, res) => {
  const result = [];

  for (const [id, device] of devices) {
    result.push({
      id: id,
      name: device.name,
      online: device.ws.readyState === 1
    });
  }

  res.json(result);
});

wss.on("connection", (ws) => {

  console.log("New connection");

  ws.on("message", (data) => {

    try {

      const message =
        JSON.parse(data.toString());

      // Android device registration
      if (message.type === "register") {

        if (!message.deviceId) {
          return;
        }

        devices.set(
          message.deviceId,
          {
            name: message.name || "Android Device",
            ws: ws
          }
        );

        ws.send(
          JSON.stringify({
            type: "registered",
            deviceId: message.deviceId
          })
        );

        console.log(
          "Device registered:",
          message.deviceId
        );

        return;
      }

      // Dashboard command
      if (message.type === "command") {

        const device =
          devices.get(message.deviceId);

        if (!device) {

          ws.send(
            JSON.stringify({
              type: "error",
              message: "Device offline"
            })
          );

          return;
        }

        const allowedCommands = [
          "back",
          "home",
          "tap",
          "swipe"
        ];

        if (
          !allowedCommands.includes(
            message.command
          )
        ) {
          return;
        }

        device.ws.send(
          JSON.stringify({
            type: "command",
            command: message.command,
            x: message.x || 0,
            y: message.y || 0,
            x2: message.x2 || 0,
            y2: message.y2 || 0,
            duration:
              message.duration || 500
          })
        );
      }

    } catch (error) {

      console.log(
        "Invalid message"
      );

    }

  });

  ws.on("close", () => {

    for (
      const [id, device]
      of devices
    ) {

      if (device.ws === ws) {
        devices.delete(id);

        console.log(
          "Device disconnected:",
          id
        );
      }

    }

  });

});

server.listen(
  PORT,
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);
