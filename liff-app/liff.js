const USER_SERVICE_UUID = "9F5E638C-EDD8-4C26-9502-C0629F85EDE5"; // LED, Button
// User service characteristics
const LED_CHARACTERISTIC_UUID = "E9062E71-9E62-4BC6-B0D3-35CDCD9B027B";
const BTN_CHARACTERISTIC_UUID = "62FBD229-6EDD-4D1A-B554-5C4E1BB29169";

// PSDI Service UUID: Fixed value for Developer Trial
const PSDI_SERVICE_UUID = "E625601E-9E55-4597-A598-76018A0D293D"; // Device ID
const PSDI_CHARACTERISTIC_UUID = "26E2B12B-85F0-4F3F-9FDD-91D114270E6E";

// UI settings
let ledState = false; // true: LED on, false: LED off
let clickCount = 0;

// Debug Flag

let skipliffCheckAvailablityAndDo = false;
let skipConnect = true;

// -------------- //
// On window load //
// -------------- //

window.onload = () => {
  try {
    console.log("window onload");
    initializeApp();
  } catch (error) {
    console.error(error);
  }
};

// ----------------- //
// Handler functions //
// ----------------- //

function handlerToggleLed() {
  try {
    ledState = !ledState;

    uiToggleLedButton(ledState);
    liffToggleDeviceLedState(ledState);
  } catch (error) {
    console.error(error);
  }
}

function handlerToggleConnect() {
  try {
    skipConnect = !skipConnect;
    document.getElementById("btn-conn-toggle").innerText =
      "skipConnect: " + skipConnect;
  } catch (error) {
    console.error(error);
  }
}

function handlerToggleAvailablty() {
  try {
    skipliffCheckAvailablityAndDo = !skipliffCheckAvailablityAndDo;
    document.getElementById("btn-av-toggle").innerText =
      "skipAvailablity: " + skipliffCheckAvailablityAndDo;
  } catch (error) {
    console.error(error);
  }
}

// ------------ //
// UI functions //
// ------------ //

function uiToggleLedButton(state) {
  try {
    const el = document.getElementById("btn-led-toggle");
    el.innerText = state ? "Switch LED OFF" : "Switch LED ON";

    if (state) {
      el.classList.add("led-on");
    } else {
      el.classList.remove("led-on");
    }
  } catch (error) {
    console.error(error);
  }
}

function uiCountPressButton() {
  try {
    clickCount++;

    const el = document.getElementById("click-count");
    el.innerText = clickCount;
  } catch (error) {
    console.error(error);
  }
}

function uiToggleStateButton(pressed) {
  try {
    const el = document.getElementById("btn-state");

    if (pressed) {
      el.classList.add("pressed");
      el.innerText = "Pressed";
    } else {
      el.classList.remove("pressed");
      el.innerText = "Released";
    }
  } catch (error) {
    console.error(error);
  }
}

function uiToggleDeviceConnected(connected) {
  try {
    const elStatus = document.getElementById("status");
    const elControls = document.getElementById("controls");

    elStatus.classList.remove("error");

    if (connected) {
      // Hide loading animation
      uiToggleLoadingAnimation(false);
      // Show status connected
      elStatus.classList.remove("inactive");
      elStatus.classList.add("success");
      elStatus.innerText = "Device connected";
      // Show controls
      elControls.classList.remove("hidden");
    } else {
      // Show loading animation
      uiToggleLoadingAnimation(true);
      // Show status disconnected
      elStatus.classList.remove("success");
      elStatus.classList.add("inactive");
      elStatus.innerText = "Device disconnected";
      // Hide controls
      //   elControls.classList.add("hidden");
    }
  } catch (error) {
    console.error(error);
  }
}

function uiToggleLoadingAnimation(isLoading) {
  try {
    const elLoading = document.getElementById("loading-animation");

    if (isLoading) {
      // Show loading animation
      elLoading.classList.remove("hidden");
    } else {
      // Hide loading animation
      elLoading.classList.add("hidden");
    }
  } catch (error) {
    console.error(error);
  }
}

function uiStatusError(message, showLoadingAnimation) {
  try {
    uiToggleLoadingAnimation(showLoadingAnimation);

    const elStatus = document.getElementById("status");
    const elControls = document.getElementById("controls");

    // Show status error
    elStatus.classList.remove("success");
    elStatus.classList.remove("inactive");
    elStatus.classList.add("error");
    elStatus.innerText = message;

    // Hide controls
    elControls.classList.add("hidden");
  } catch (error) {
    console.error(error);
  }
}

function makeErrorMsg(errorObj) {
  return "Error\n" + errorObj.code + "\n" + errorObj.message;
}

// -------------- //
// LIFF functions //
// -------------- //

function initializeApp() {
  try {
    console.log("initializeApp");
    liff.init(
      () => initializeLiff(),
      error => uiStatusError(makeErrorMsg(error), false)
    );
  } catch (error) {
    console.error(error);
  }
}

function initializeLiff() {
  try {
    console.log("initializeLiff");
    liff
      .initPlugins(["bluetooth"])
      .then(() => {
        if (skipliffCheckAvailablityAndDo) return;
        console.log("initPlugins");
        liffCheckAvailablityAndDo(() => liffRequestDevice());
      })
      .catch(error => {
        uiStatusError(makeErrorMsg(error), false);
      });
  } catch (error) {
    console.error(error);
  }
}

function liffCheckAvailablityAndDo(callbackIfAvailable) {
  try {
    console.log("liffCheckAvailablityAndDo");
    // Check Bluetooth availability
    liff.bluetooth
      .getAvailability()
      .then(isAvailable => {
        console.log("getAvailability: ", isAvailable);
        if (isAvailable) {
          console.log("callbackIfAvailable");
          uiToggleDeviceConnected(false);
          callbackIfAvailable();
        } else {
          uiStatusError("Bluetooth not available", true);
          setTimeout(
            () => liffCheckAvailablityAndDo(callbackIfAvailable),
            10000
          );
        }
      })
      .catch(error => {
        uiStatusError(makeErrorMsg(error), false);
      });
  } catch (error) {
    console.error(error);
  }
}

function liffRequestDevice() {
  try {
    console.log("liffRequestDevice");
    liff.bluetooth
      .requestDevice()
      .then(device => {
        console.log("requestDevice resolve");
        liffConnectToDevice(device);
      })
      .catch(error => {
        uiStatusError(makeErrorMsg(error), false);
      });
  } catch (error) {
    console.error(error);
  }
}

function liffConnectToDevice(device) {
  try {
    console.log("liffConnectToDevice");
    device.gatt
      .connect()
      .then(() => {
        console.log("connected to device resolve");
        if (skipConnect) return;
        document.getElementById("device-name").innerText = device.name;
        document.getElementById("device-id").innerText = device.id;

        // Show status connected
        uiToggleDeviceConnected(true);

        // Get service
        device.gatt
          .getPrimaryService(USER_SERVICE_UUID)
          .then(service => {
            console.log("getPrimaryService resolve");
            liffGetUserService(service);
          })
          .catch(error => {
            uiStatusError(makeErrorMsg(error), false);
          });
        device.gatt
          .getPrimaryService(PSDI_SERVICE_UUID)
          .then(service => {
            console.log("getPrimaryService PSDI resolve");
            liffGetPSDIService(service);
          })
          .catch(error => {
            uiStatusError(makeErrorMsg(error), false);
          });

        // Device disconnect callback
        const disconnectCallback = () => {
          console.log("disconnectCallback");
          // Show status disconnected
          uiToggleDeviceConnected(false);

          // Remove disconnect callback
          device.removeEventListener(
            "gattserverdisconnected",
            disconnectCallback
          );

          // Reset LED state
          ledState = false;
          // Reset UI elements
          uiToggleLedButton(false);
          uiToggleStateButton(false);

          // Try to reconnect
          initializeLiff();
        };

        device.addEventListener("gattserverdisconnected", disconnectCallback);
      })
      .catch(error => {
        uiStatusError(makeErrorMsg(error), false);
      });
  } catch (error) {
    console.error(error);
  }
}

function liffGetUserService(service) {
  try {
    console.log("liffGetUserService");
    // Button pressed state
    service
      .getCharacteristic(BTN_CHARACTERISTIC_UUID)
      .then(characteristic => {
        console.log("btn char resolve");
        liffGetButtonStateCharacteristic(characteristic);
      })
      .catch(error => {
        uiStatusError(makeErrorMsg(error), false);
      });

    // Toggle LED
    service
      .getCharacteristic(LED_CHARACTERISTIC_UUID)
      .then(characteristic => {
        console.log("led char resolve");
        window.ledCharacteristic = characteristic;

        // Switch off by default
        liffToggleDeviceLedState(false);
      })
      .catch(error => {
        uiStatusError(makeErrorMsg(error), false);
      });
  } catch (error) {
    console.error(error);
  }
}

function liffGetPSDIService(service) {
  try {
    console.log("liffGetPSDIService");
    // Get PSDI value
    service
      .getCharacteristic(PSDI_CHARACTERISTIC_UUID)
      .then(characteristic => {
        console.log("PSDI char resolve");
        return characteristic.readValue();
      })
      .then(value => {
        console.log("PSDI value resolve");
        // Byte array to hex string
        const psdi = new Uint8Array(value.buffer).reduce(
          (output, byte) => output + ("0" + byte.toString(16)).slice(-2),
          ""
        );
        document.getElementById("device-psdi").innerText = psdi;
      })
      .catch(error => {
        uiStatusError(makeErrorMsg(error), false);
      });
  } catch (error) {
    console.error(error);
  }
}

function liffGetButtonStateCharacteristic(characteristic) {
  // Add notification hook for button state
  // (Get notified when button state changes)
  try {
    console.log("liffGetButtonStateCharacteristic");
    characteristic
      .startNotifications()
      .then(() => {
        console.log("btn char notify resolve");
        characteristic.addEventListener("characteristicvaluechanged", e => {
          const val = new Uint8Array(e.target.value.buffer)[0];
          if (val > 0) {
            // press
            uiToggleStateButton(true);
          } else {
            // release
            uiToggleStateButton(false);
            uiCountPressButton();
          }
        });
      })
      .catch(error => {
        uiStatusError(makeErrorMsg(error), false);
      });
  } catch (error) {
    console.error(error);
  }
}

function liffToggleDeviceLedState(state) {
  try {
    // on: 0x01
    // off: 0x00
    console.log("liffToggleDeviceLedState");
    window.ledCharacteristic
      .writeValue(state ? new Uint8Array([0x01]) : new Uint8Array([0x00]))
      .catch(error => {
        uiStatusError(makeErrorMsg(error), false);
      });
  } catch (error) {
    console.error(error);
  }
}
