import "./App.css";

import * as THREE from "three";

import { Canvas, useFrame } from "@react-three/fiber";
import Peer, { DataConnection } from "peerjs";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import { QRCodeSVG } from "qrcode.react";

async function getControllerUrl() {
  const envUrl = import.meta.env.VITE_REACT_APP_CONTROLLER_URL;
  if (envUrl) {
    console.log("Controller URL set in environment variable");
    return envUrl;
  }

  const filePath = "/tmp/network-address.txt";
  try {
    const response = await fetch(filePath);
    if (response.ok) {
      const networkAddress = await response.text();
      return networkAddress.trim();
    }
  } catch (error) {
    console.error("Failed to fetch network address:", error);
  }

  throw new Error("Controller URL not set in environment variable or file");
}

const DisplayContext = createContext({
  acceleration: { current: { x: 0, y: 0, z: 0 } },
});

type Acceleration = {
  x: number;
  y: number;
  z: number;
};

type Orientation = {
  absolute?: boolean;
  alpha: number;
  beta: number;
  gamma: number;
};

type DeviceData = {
  acceleration?: Acceleration;
  orientation?: Orientation;
};

function Torus({
  position,
  rotation,
}: {
  position: { x: number; y: number; z: number };
  rotation: [number, number, number];
}) {
  const torusRef = useRef<THREE.Mesh>(null);
  const { acceleration: targetAccel } = useContext(DisplayContext);
  const velocity = useRef({ x: 0, y: 0, z: 0 });
  const currentPosition = useRef({
    x: position.x,
    y: position.y,
    z: position.z,
  });

  useEffect(() => {
    currentPosition.current = { ...position };
  }, [position]);

  useFrame((_, delta) => {
    if (!torusRef.current) return;

    // Convert acceleration to velocity
    velocity.current = {
      x: velocity.current.x + targetAccel.current.x * delta,
      y: velocity.current.y + targetAccel.current.y * delta,
      z: velocity.current.z + targetAccel.current.z * delta,
    };

    // Apply some damping to velocity
    velocity.current = {
      x: velocity.current.x * 0.95,
      y: velocity.current.y * 0.95,
      z: velocity.current.z * 0.95,
    };

    // Convert velocity to position
    currentPosition.current = {
      x: currentPosition.current.x + velocity.current.x * delta,
      y: currentPosition.current.y + velocity.current.y * delta,
      z: currentPosition.current.z + velocity.current.z * delta,
    };

    console.log("Current position:", currentPosition.current);

    // Update mesh position
    torusRef.current.position.set(
      currentPosition.current.x,
      currentPosition.current.y,
      currentPosition.current.z
    );
  });

  return (
    <mesh
      ref={torusRef}
      position={[position.x, position.y, position.z]}
      rotation={rotation}
    >
      <torusGeometry />
      <meshNormalMaterial />
    </mesh>
  );
}

function App() {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [conn, setConn] = useState<DataConnection | null>(null);
  const [controllerUrl, setControllerUrl] = useState<string | null>(null);
  const targetAcceleration = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    getControllerUrl().then(setControllerUrl).catch(console.error);
  }, []);

  useEffect(() => {
    const peer = new Peer();

    peer.on("open", (id) => {
      setPeerId(id);
    });

    peer.on("connection", async (conn) => {
      setConn(conn);
      conn.on("data", (data) => {
        const typedData = data as DeviceData;
        if (typedData?.acceleration) {
          targetAcceleration.current = typedData.acceleration;
          console.log("Acceleration:", typedData.acceleration);
        }
        if (typedData?.orientation) {
          console.log("Orientation:", typedData.orientation);
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

  if (!controllerUrl) {
    return <div>Loading...</div>;
  }

  const qrCodeUrl = `${controllerUrl}?display_id=${encodeURIComponent(
    peerId || ""
  )}`;

  return (
    <div className="container">
      {conn ? (
        <DisplayContext.Provider value={{ acceleration: targetAcceleration }}>
          <Canvas style={{ flex: 1 }}>
            <Scene />
          </Canvas>
        </DisplayContext.Provider>
      ) : peerId ? (
        <div className="qr-code-container">
          <a href={qrCodeUrl} target="_blank" rel="noopener noreferrer">
            <QRCodeSVG value={qrCodeUrl} />
          </a>
          <p>{qrCodeUrl}</p>
        </div>
      ) : (
        <div className="qr-code-container">Loading...</div>
      )}
    </div>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 2, 2]} />
      <Torus position={{ x: 0, y: 0, z: 0 }} rotation={[0, 0, 0]} />
    </>
  );
}

export default App;
