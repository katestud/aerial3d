import "./App.css";

import Peer, { DataConnection } from "peerjs";
import { useEffect, useRef, useState } from "react";

import { Canvas } from "@react-three/fiber";
import { DeviceData } from "./types/device";
import { DisplayContext } from "./context/DisplayContext";
import { LiveTorus } from "./components/LiveTorus";
import { QRCodeSVG } from "qrcode.react";
import { RecordedTorus } from "./components/RecordedTorus";
import { RecordingFileList } from "./components/RecordingFileList";
import { getControllerUrl } from "./utils/controllerUrl";
import { parseCSVToDeviceData } from "./utils/parseCSVData";

// Add new type for display modes
type DisplayMode = "qr-scan" | "file-playback";

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
      <LiveTorus
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
