import { FaPause, FaPlay } from 'react-icons/fa';
import { useEffect, useState } from 'react';

import { Canvas } from '@react-three/fiber';
import { MathUtils } from 'three';
import { OrbitControls } from '@react-three/drei';

function Torus({position, rotation}) {
  return(
    <mesh position={position} rotation={rotation}>
      <torusGeometry />
      <meshNormalMaterial />
    </mesh>
  )
}

function App() {
  const [data, setData] = useState([]);
  const [frame, setFrame] = useState(0);
  const [speed, setSpeed] = useState(250);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetch('/data.csv')
      .then((response) => response.text())
      .then((csv) => {
        const rows = csv.trim().split('\n').slice(1);
        const parsedData = rows.map((row) => {
          const [, x, y, z, rx, ry, rz] = row.split(',').map(Number);
          return {
            x,
            y,
            z,
            rx,
            ry,
            rz
          };
        });
        setData(parsedData);
      });
  }, []);

  useEffect(() => {
    let interval;
    if (isPlaying && data.length > 0) {
      interval = setInterval(() => {
        setFrame((prev) => (prev + 1) % data.length);
      }, speed);
      return () => clearInterval(interval);
    };
  }, [data, speed, isPlaying]);

  const currentFrame = data[frame] || { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz:0 };

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Canvas style={{ flex: 1 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[2, 2, 2]} />
            <Torus
              position={[currentFrame.x / 1000, currentFrame.y / 1000,currentFrame.z / 1000]}
              rotation={[
                MathUtils.degToRad(currentFrame.rx),
                MathUtils.degToRad(currentFrame.ry),
                MathUtils.degToRad(currentFrame.rz)
              ]}
            />
            {/* <OrbitControls /> */}
        </Canvas>

        <div style={{ padding: '10px', background: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsPlaying((prev) => !prev)}
            style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
          >
            {isPlaying ? <FaPause size={12}/> : <FaPlay size={12}/>}
          </button>
          <label>
              Speed:
              <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
              />
              {speed} ms/frame
          </label>
        </div>
      </div>
    );
}

export default App;

