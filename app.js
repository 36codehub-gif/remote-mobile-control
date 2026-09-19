// ==========================================
// Remote Mobile Control - Dashboard
// ==========================================

let selectedDevice = null;

// Demo device data
const devices = [
  {
    id: "android-001",
    name: "My Android",
    online: true,
    battery: 82,
    storage: "64 GB",
    network: "Wi-Fi"
  }
];


// ==========================================
// Select Device
// ==========================================

function selectDevice(deviceId) {

  selectedDevice =
    devices.find(device => device.id === deviceId);

  if (!selectedDevice) {
    showMessage("Device not found.");
    return;
  }

  showMessage(
    "Selected: " + selectedDevice.name
  );
}


// ==========================================
// Send Remote Command
// ==========================================

function sendCommand(command) {

  if (!selectedDevice) {

    showMessage(
      "Please select a device first."
    );

    return;
  }

  if (!selectedDevice.online) {

    showMessage(
      "Device is offline."
    );

    return;
  }

  /*
    This is currently the dashboard layer.

    Later, commands will be sent through
    an authenticated WebSocket connection
    to the authorized Android agent.
  */

  const commands = {
    back: "Back command",
    home: "Home command",
    tap: "Tap command",
    swipe: "Swipe command",
    screen: "Screen request",
    files: "File manager request",
    lock: "Lock request"
  };

  showMessage(
    commands[command] ||
    "Unknown command"
  );
}


// ==========================================
// Pair Device
// ==========================================

function pairDevice() {

  const code =
    prompt(
      "Enter the pairing code shown on your authorized Android device:"
    );

  if (!code) {
    showMessage("Pairing cancelled.");
    return;
  }

  /*
    Real pairing will be implemented later
    using the backend and an authenticated
    device session.
  */

  if (code.length < 4) {

    showMessage(
      "Invalid pairing code."
    );

    return;
  }

  showMessage(
    "Pairing request created. Confirm it on the Android device."
  );
}


// ==========================================
// Status Message
// ==========================================

function showMessage(message) {

  const element =
    document.getElementById("message");

  if (element) {
    element.textContent = message;
  }
}


// ==========================================
// Demo Device Selection
// ==========================================

window.addEventListener("DOMContentLoaded", () => {

  const deviceElements =
    document.querySelectorAll(".device");

  deviceElements.forEach((element, index) => {

    if (devices[index]) {

      element.addEventListener(
        "click",
        () => selectDevice(devices[index].id)
      );

      element.style.cursor = "pointer";
    }

  });

});
