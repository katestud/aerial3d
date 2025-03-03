import "./App.css";

import { useEffect, useState } from "react";

function App() {
  const [acceleration, setAcceleration] = useState([0, 0, 0]);
  const [orientation, setOrientation] = useState([0, 0, 0]);

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

  return (
    <>
      <h1>Aerial 3d</h1>
      <p>Acceleration: {acceleration}</p>
      <p>Orientation: {orientation}</p>
    </>
  );
}

export default App;
