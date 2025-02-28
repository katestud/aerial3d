import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function Torus() {
  return(
    <mesh>
      <torusGeometry />
      <meshNormalMaterial />
    </mesh>
  )
}

function App() {
    return (
      <div id="canvas-container">
        <Canvas style={{ height: '100vh' }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[2, 2, 2]} color="green" />
            <Torus />
            <OrbitControls />
        </Canvas>
      </div>
    );
}

export default App;

