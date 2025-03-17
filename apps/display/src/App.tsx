import "./App.css";

import * as THREE from "three";

import { Canvas, useFrame } from "@react-three/fiber";
import Peer, { DataConnection } from "peerjs";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import { DeviceData } from "./types/device";
import { QRCodeSVG } from "qrcode.react";
import { RecordingFileList } from "./components/recording_file_list";
import { getControllerUrl } from "./utils/controllerUrl";
import { parseCSVToDeviceData } from "./utils/parseCSVData";

const DisplayContext = createContext({
  acceleration: { current: { x: 0, y: 0, z: 0 } },
  orientation: { current: { alpha: 0, beta: 0, gamma: 0 } },
  rotationRate: { current: { alpha: 0, beta: 0, gamma: 0 } },
});

// Add new type for display modes
type DisplayMode = "qr-scan" | "file-playback";

function Torus({
  position,
  rotation,
  useOrientation,
  useAcceleration,
}: {
  position: { x: number; y: number; z: number };
  rotation: { alpha: number; beta: number; gamma: number };
  useOrientation: boolean;
  useAcceleration: boolean;
}) {
  const torusRef = useRef<THREE.Mesh>(null);
  const {
    acceleration: targetAccel,
    orientation: targetOrientation,
    rotationRate: targetRotationRate,
  } = useContext(DisplayContext);

  const velocity = useRef({ x: 0, y: 0, z: 0 });
  const currentPosition = useRef({
    x: position.x,
    y: position.y,
    z: position.z,
  });

  // Set the current rotation to the device's current value so we can
  // compare it in later stages to apply a diff (if needed).
  const currentRotation = useRef({
    alpha: rotation.alpha,
    beta: rotation.beta,
    gamma: rotation.gamma,
  });

  useEffect(() => {
    currentPosition.current = { ...position };
    currentRotation.current = { ...rotation };
  }, [position, rotation]);

  useFrame((_, delta) => {
    if (!torusRef.current) return;

    // BEGIN: POSITIONING THE DEVICE ON THE SCREEN
    if (useAcceleration) {
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

      // // Update mesh position
      torusRef.current.position.set(
        currentPosition.current.x,
        currentPosition.current.y,
        currentPosition.current.z
      );
    }
    // END: POSITIONING THE DEVICE ON THE SCREEN

    // BEGIN: ROTATING THE DEVICE ON THE SCREEN
    if (useOrientation) {
      // To set the device position based on the "absolute" value from the device,
      // we can just update the value with the raw orientation value.
      currentRotation.current = {
        alpha: targetOrientation.current.alpha,
        beta: targetOrientation.current.beta,
        gamma: targetOrientation.current.gamma,
      };
    } else {
      // To set the device position based on the rotation rate value, which is
      // more similar to data we would get from an embedded device, we can take
      // a diff with the current rotation value and increment it, using the delta
      // time to apply the rate.
      currentRotation.current = {
        alpha:
          currentRotation.current.alpha +
          targetRotationRate.current.alpha * delta,
        beta:
          currentRotation.current.beta +
          targetRotationRate.current.beta * delta,
        gamma:
          currentRotation.current.gamma +
          targetRotationRate.current.gamma * delta,
      };
    }

    torusRef.current.rotation.set(
      THREE.MathUtils.degToRad(currentRotation.current.alpha),
      THREE.MathUtils.degToRad(currentRotation.current.beta),
      THREE.MathUtils.degToRad(currentRotation.current.gamma)
    );
    // END: ROTATING THE DEVICE ON THE SCREEN
  });

  return (
    <mesh
      ref={torusRef}
      position={[position.x, position.y, position.z]}
      rotation={[rotation.alpha, rotation.beta, rotation.gamma]}
    >
      <torusGeometry />
      <meshNormalMaterial />
    </mesh>
  );
}

function App() {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [conn, setConn] = useState<DataConnection | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("qr-scan");
  const [controllerUrl, setControllerUrl] = useState<string | null>(null);
  const targetAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const targetOrientation = useRef({ alpha: 0, beta: 0, gamma: 0 });
  const targetRotationRate = useRef({ alpha: 0, beta: 0, gamma: 0 });

  const urlParams = new URLSearchParams(window.location.search);
  const useOrientation = urlParams.get("useorientation") === "true";
  const useAcceleration = urlParams.get("useacceleration") === "true";

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
        // Receive information from the controller and set it to target
        // values that we'll use the update the display.
        const typedData = data as DeviceData;
        if (typedData?.acceleration) {
          targetAcceleration.current = typedData.acceleration;
        }
        if (typedData?.orientation) {
          targetOrientation.current = typedData.orientation;
        }
        if (typedData?.rotationRate) {
          targetRotationRate.current = typedData.rotationRate;
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
      <nav className="mode-selector">
        <button
          onClick={() => setDisplayMode("qr-scan")}
          className={displayMode === "qr-scan" ? "active" : ""}
        >
          Live Device
        </button>
        <button
          onClick={() => setDisplayMode("file-playback")}
          className={displayMode === "file-playback" ? "active" : ""}
        >
          Recorded Data
        </button>
      </nav>
      {displayMode === "qr-scan" ? (
        <>
          {conn ? (
            <DisplayContext.Provider
              value={{
                acceleration: targetAcceleration,
                orientation: targetOrientation,
                rotationRate: targetRotationRate,
              }}
            >
              <Canvas style={{ flex: 1 }}>
                <Scene
                  useOrientation={useOrientation}
                  useAcceleration={useAcceleration}
                />
              </Canvas>
            </DisplayContext.Provider>
          ) : peerId ? (
            <div className="qr-code-container">
              <a href={qrCodeUrl} target="_blank" rel="noopener noreferrer">
                <QRCodeSVG value={qrCodeUrl} />
              </a>
              <p>Scan the code with your phone to visualize its position!</p>
            </div>
          ) : (
            <div className="qr-code-container">Loading...</div>
          )}
        </>
      ) : (
        <FilePlayback />
      )}
    </div>
  );
}

function Scene({
  useOrientation,
  useAcceleration,
}: {
  useOrientation: boolean;
  useAcceleration: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 2, 2]} />
      <Torus
        position={{ x: 0, y: 0, z: 0 }}
        rotation={{ alpha: 0, beta: 0, gamma: 0 }}
        useOrientation={useOrientation}
        useAcceleration={useAcceleration}
      />
    </>
  );
}

function FilePlayback() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileData, setFileData] = useState<DeviceData[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: string) => {
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error("Failed to load recording");

      const csvText = await response.text();
      const data = parseCSVToDeviceData(csvText);
      setFileData(data);
      setSelectedFile(file);
    } catch (err) {
      console.error("Error loading recording:", err);
      setError("Failed to load recording");
    }
  };

  return (
    <div className="file-playback">
      {!selectedFile ? (
        <RecordingFileList onFileSelect={handleFileSelect} />
      ) : (
        <DisplayContext.Provider
          // TODO: This currently just sets the position to 0,0,0, but it should
          // read from the file.
          value={{
            acceleration: { current: { x: 0, y: 0, z: 0 } },
            orientation: { current: { alpha: 0, beta: 0, gamma: 0 } },
            rotationRate: { current: { alpha: 0, beta: 0, gamma: 0 } },
          }}
        >
          <div className="playback-controls">
            <button onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button onClick={() => setSelectedFile(null)}>
              Back to File List
            </button>
          </div>
          <Canvas style={{ flex: 1 }}>
            <Scene useOrientation={true} useAcceleration={true} />
          </Canvas>
        </DisplayContext.Provider>
      )}
    </div>
  );
}

export default App;
