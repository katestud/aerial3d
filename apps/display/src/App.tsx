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
import { RobotTorus } from "./components/RobotTorus";
import { getControllerUrl } from "./utils/controllerUrl";
import { parseCSVToDeviceData } from "./utils/parseCSVData";

type DisplayMode = "qr-scan" | "file-playback" | "robot-arm";

function App() {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [conn, setConn] = useState<DataConnection | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("robot-arm");
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
  }, []);

  const [robotParams, setRobotParams] = useState<Array<number>>([
    0, 0, 0, 0, 0, 0,
  ]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    socketRef.current = new WebSocket("ws://10.100.11.67:9001");

    socketRef.current.onopen = () => {
      console.log("WebSocket connected");
      socketRef.current?.send(JSON.stringify({ type: "hello" }));
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setRobotParams(data);
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error", error);
    };

    return () => {
      socketRef.current?.close();
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
        <button
          onClick={() => setDisplayMode("robot-arm")}
          className={displayMode === "robot-arm" ? "active" : ""}
        >
          Robot Arm
        </button>
      </nav>
      {displayMode === "qr-scan" && (
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
                  mode="live-phone"
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
      )}
      {displayMode === "file-playback" && (
        <FilePlayback useAcceleration={useAcceleration} />
      )}
      {displayMode === "robot-arm" && (
        <RobotControlled armPosition={robotParams} />
      )}
    </div>
  );
}

function Scene({
  useOrientation,
  useAcceleration,
  mode,
  fileData,
  onTimeUpdate,
  isPlaying,
  armPosition,
}: {
  useOrientation: boolean;
  useAcceleration: boolean;
  mode: "live-phone" | "file" | "robot-arm";
  fileData?: DeviceData[];
  onTimeUpdate?: (time: number) => void;
  isPlaying?: boolean;
  armPosition?: Array<number>;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 2, 2]} />
      {mode === "live-phone" && (
        <LiveTorus
          position={{ x: 0, y: 0, z: 0 }}
          rotation={{ alpha: 0, beta: 0, gamma: 0 }}
          useOrientation={useOrientation}
          useAcceleration={useAcceleration}
        />
      )}{" "}
      {mode === "file" && (
        <RecordedTorus
          position={{ x: 0, y: 0, z: 0 }}
          rotation={{ alpha: 0, beta: 0, gamma: 0 }}
          data={fileData || []}
          useAcceleration={useAcceleration}
          onTimeUpdate={onTimeUpdate}
          isPlaying={isPlaying || false}
        />
      )}
      {mode === "robot-arm" && armPosition && (
        <RobotTorus
          position={{ x: 0, y: 0, z: -1 }}
          rotation={{ alpha: 0, beta: 0, gamma: 0 }}
          useOrientation={useOrientation}
          useAcceleration={useAcceleration}
          armPosition={armPosition}
        />
      )}{" "}
    </>
  );
}

function FilePlayback({ useAcceleration }: { useAcceleration: boolean }) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileData, setFileData] = useState<DeviceData[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

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
    <div
      className="file-playback"
      style={{ flex: 1, display: "flex", flexDirection: "column" }}
    >
      {!selectedFile ? (
        <RecordingFileList onFileSelect={handleFileSelect} />
      ) : (
        <>
          <div
            className="playback-controls"
            style={{ position: "absolute", zIndex: 1 }}
          >
            <button onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button onClick={() => setSelectedFile(null)}>
              Back to File List
            </button>
          </div>
          <div className="elapsed-time">{elapsedTime.toFixed(3)}s</div>
          <Canvas style={{ width: "100%", height: "100%" }}>
            <Scene
              useOrientation={false}
              useAcceleration={useAcceleration}
              mode="file"
              fileData={fileData}
              onTimeUpdate={setElapsedTime}
              isPlaying={isPlaying}
            />
          </Canvas>
        </>
      )}
    </div>
  );
}

function RobotControlled({ armPosition }: { armPosition: Array<number> }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <>
        <Canvas style={{ width: "100%", height: "100%" }}>
          <Scene
            mode="robot-arm"
            useOrientation={false}
            useAcceleration={false}
            armPosition={armPosition}
          />
        </Canvas>
      </>
    </div>
  );
}

export default App;
