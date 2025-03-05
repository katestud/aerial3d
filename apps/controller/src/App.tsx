import "./App.css";

import Peer, { DataConnection } from "peerjs";
import { useEffect, useState } from "react";

function App() {
  const [acceleration, setAcceleration] = useState([0, 0, 0]);
  const [rotationRate, setRotationRate] = useState([0, 0, 0]);
  const [orientation, setOrientation] = useState([0, 0, 0]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [conn, setConn] = useState<DataConnection | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const displayPeerId = urlParams.get("display_id");

    const peer = new Peer();

    peer.on("open", () => {
      if (!displayPeerId) return;

      const conn = peer.connect(displayPeerId, { reliable: true });
      setConn(conn);
    });

    // Clean up peer connection the next time the component unmounts
    return () => {
      peer.destroy();
    };
  }, []);

  useEffect(() => {
    const handler = (event: DeviceMotionEvent) => {
      if (event.acceleration) {
        const accel = event.acceleration;
        setAcceleration([accel.x || 0, accel.y || 0, accel.z || 0]);
        conn?.send({
          acceleration: {
            x: accel.x || 0,
            y: accel.y || 0,
            z: accel.z || 0,
          },
        });
      }
      if (event.rotationRate) {
        const rotation = event.rotationRate;
        setRotationRate([
          rotation.alpha || 0,
          rotation.beta || 0,
          rotation.gamma || 0,
        ]);
        conn?.send({
          rotationRate: {
            alpha: rotation.alpha || 0,
            beta: rotation.beta || 0,
            gamma: rotation.gamma || 0,
          },
        });
      }
    };
    window.addEventListener("devicemotion", handler);
    return () => {
      window.removeEventListener("devicemotion", handler);
    };
  }, [conn]);

  useEffect(() => {
    // The device orientation event fires when the device moves or changes orientation. It returns data about the difference between the device in its current position in relation to the Earth coordinate frame.
    const handler = (event: DeviceOrientationEvent) => {
      // event also has an event.absolute property that indicates whether or
      // not the orientation data is absolute or relative to the Earth
      // coordinate frame.
      setOrientation([event.alpha || 0, event.beta || 0, event.gamma || 0]);
      conn?.send({
        orientation: {
          alpha: event.alpha || 0,
          beta: event.beta || 0,
          gamma: event.gamma || 0,
        },
      });
    };
    window.addEventListener("deviceorientation", handler);
    return () => {
      window.removeEventListener("deviceorientation", handler);
    };
  }, [conn]);

  const requestPermission = async () => {
    // @ts-expect-error - IOS
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      try {
        // @ts-expect-error - IOS
        const permissionState = await DeviceMotionEvent.requestPermission();
        const orientationPermission =
          // @ts-expect-error - IOS
          await DeviceOrientationEvent.requestPermission();

        if (
          permissionState === "granted" &&
          orientationPermission === "granted"
        ) {
          setPermissionGranted(true);
        }
      } catch (err) {
        console.error("Permission request failed:", err);
      }
    } else {
      // Handle regular non-iOS devices
      setPermissionGranted(true);
    }
  };

  return (
    <>
      <h1>Aerial 3d</h1>
      {!permissionGranted && (
        <button onClick={requestPermission}>Enable Motion Sensors</button>
      )}
      <p>
        Acceleration: {acceleration[0].toFixed(3)}, {acceleration[1].toFixed(3)}
        , {acceleration[2].toFixed(3)}
      </p>
      <p>
        Rotation Rate: {rotationRate[0].toFixed(3)},{" "}
        {rotationRate[1].toFixed(3)}, {rotationRate[2].toFixed(3)}
      </p>
      <p>
        Orientation: {orientation[0].toFixed(3)}, {orientation[1].toFixed(3)},{" "}
        {orientation[2].toFixed(3)}
      </p>
    </>
  );
}

export default App;
