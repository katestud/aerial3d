import "./App.css";

import Peer, { DataConnection } from "peerjs";
import { useEffect, useRef, useState } from "react";

function App() {
  const [acceleration, setAcceleration] = useState([0, 0, 0]);
  const [orientation, setOrientation] = useState([0, 0, 0]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const peerId = useRef<string | null>(null);
  const [conn, setConn] = useState<DataConnection | null>(null);

  useEffect(() => {
    const peer = new Peer();

    peer.on("open", (id) => {
      peerId.current = id;
      const urlParams = new URLSearchParams(window.location.search);
      const displayPeerId = urlParams.get("peerid");

      if (!displayPeerId) return;

      const conn = peer.connect(displayPeerId, { reliable: true });
      setConn(conn);
    });

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
          acceleration: { x: accel.x || 0, y: accel.y || 0, z: accel.z || 0 },
        });
      }
    };
    window.addEventListener("devicemotion", handler);
    return () => {
      window.removeEventListener("devicemotion", handler);
    };
  }, [conn]);

  useEffect(() => {
    const handler = (event: DeviceOrientationEvent) => {
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
        Orientation: {orientation[0].toFixed(3)}, {orientation[1].toFixed(3)},{" "}
        {orientation[2].toFixed(3)}
      </p>
    </>
  );
}

export default App;
