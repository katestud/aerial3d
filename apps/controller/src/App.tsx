import "./App.css";

import { useEffect, useState } from "react";

function App() {
  const [acceleration, setAcceleration] = useState([0, 0, 0]);
  const [orientation, setOrientation] = useState([0, 0, 0]);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    const handler = (event: DeviceMotionEvent) => {
      if (event.acceleration) {
        const accel = event.acceleration;
        setAcceleration([accel.x || 0, accel.y || 0, accel.z || 0]);
      }
    };
    window.addEventListener("devicemotion", handler);
    return () => {
      window.removeEventListener("devicemotion", handler);
    };
  }, []);

  useEffect(() => {
    const handler = (event: DeviceOrientationEvent) => {
      setOrientation([event.alpha || 0, event.beta || 0, event.gamma || 0]);
    };
    window.addEventListener("deviceorientation", handler);
    return () => {
      window.removeEventListener("deviceorientation", handler);
    };
  }, []);

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
