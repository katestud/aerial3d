import { Canvas, useFrame } from "@react-three/fiber";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import Peer from "peerjs";
import { QRCodeSVG } from "qrcode.react";

const CONTROLLER_URL = "https://10.100.11.246:5173/";

const DisplayContext = createContext({
  acceleration: { current: { x: 0, y: 0, z: 0 } },
});

type Acceleration = {
  x: number;
  y: number;
  z: number;
};

type Data = {
  acceleration?: Acceleration;
};

function Torus({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const torusRef = useRef<Acceleration>({ x: 0, y: 0, z: 0 });
  const { acceleration: targetAccel } = useContext(DisplayContext);
  const velocity = useRef({ x: 0, y: 0, z: 0 });
  const currentPosition = useRef({ x: 0, y: 0, z: 0 });

  useFrame((_, delta) => {
    if (!torusRef.current) return;

    // Convert acceleration to velocity (v = v0 + at)
    velocity.current = {
      x: velocity.current.x + targetAccel.current.x * delta,
      y: velocity.current.y + targetAccel.current.y * delta,
      z: velocity.current.z + targetAccel.current.z * delta,
    };

    // // Apply some damping to velocity to prevent infinite movement
    // velocity.current = {
    //   x: velocity.current.x * 0.95,
    //   y: velocity.current.y * 0.95,
    //   z: velocity.current.z * 0.95,
    // };

    // Convert velocity to position (x = x0 + vt)
    currentPosition.current = {
      x: currentPosition.current.x + velocity.current.x * delta,
      y: currentPosition.current.y + velocity.current.y * delta,
      z: currentPosition.current.z + velocity.current.z * delta,
    };

    console.log(targetAccel.current.x);

    const position = torusRef.current;
    position.x = currentPosition.current.x;
    position.y = currentPosition.current.y;
    position.z = currentPosition.current.z;
  });

  return (
    <mesh ref={torusRef} position={position} rotation={rotation}>
      <torusGeometry />
      <meshNormalMaterial />
    </mesh>
  );
}

function App() {
  const [peerId, setPeerId] = useState<string | null>(null);
  const targetAcceleration = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    const peer = new Peer();

    peer.on("open", (id) => {
      setPeerId(id);
    });

    peer.on("connection", async (conn) => {
      console.log("on connection");
      conn.on("data", (data) => {
        const typedData = data as Data;
        if (typedData?.acceleration) {
          targetAcceleration.current = typedData.acceleration;
        }
      });

      conn.on("open", () => {
        conn.send({ init: true });
      });
    });

    return () => {
      peer.destroy();
    };
  }, []);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <DisplayContext.Provider value={{ acceleration: targetAcceleration }}>
        <Canvas style={{ flex: 1 }}>
          <Scene />
        </Canvas>
      </DisplayContext.Provider>

      <QRCodeSVG
        value={`${CONTROLLER_URL}?peerid=${encodeURIComponent(peerId || "")}`}
      />
      <p>{`${CONTROLLER_URL}?peerid=${encodeURIComponent(peerId || "")}`}</p>
    </div>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 2, 2]} />
      <Torus position={[0, 0, 0]} rotation={[0, 0, 0]} />
    </>
  );
}

export default App;
