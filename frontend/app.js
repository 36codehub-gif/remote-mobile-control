let socket;
let token;
let selectedDevice;

function connect() {

  token = document.getElementById("token").value;

  socket = new WebSocket(
    `ws://${location.host}/ws`
  );

  socket.onopen = () => {

    socket.send(JSON.stringify({
      type: "dashboard_auth",
      adminToken: token
    }));

    loadDevices();
  };
}

async function loadDevices() {

  const response = await fetch("/api/devices", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) return;

  const devices = await response.json();

  const container =
    document.getElementById("devices");

  container.innerHTML = "";

  devices.forEach(device => {

    const button =
      document.createElement("button");

    button.textContent =
      `${device.name} — ${
        device.online ? "ONLINE" : "OFFLINE"
      }`;

    button.onclick = () => {
      selectedDevice = device.deviceId;
    };

    container.appendChild(button);
    container.appendChild(
      document.createElement("br")
    );
  });
}

function send(command) {

  if (!selectedDevice) {
    alert("Select a device first.");
    return;
  }

  socket.send(JSON.stringify({

    type: "command",

    deviceId: selectedDevice,

    command,

    x: Number(
      document.getElementById("x").value || 0
    ),

    y: Number(
      document.getElementById("y").value || 0
    ),

    x2: Number(
      document.getElementById("x2").value || 0
    ),

    y2: Number(
      document.getElementById("y2").value || 0
    ),

    duration: 500

  }));
}

setInterval(loadDevices, 5000);
