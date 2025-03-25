import * as THREE from "three";

import { useEffect, useRef } from "react";

import { useFrame } from "@react-three/fiber";

type RobotTorusProps = {
  armPosition: Array<number>;
};

export function RobotTorus({ armPosition }: RobotTorusProps) {
  const torusRef = useRef<THREE.Mesh>(null);
  console.log("armPosition", armPosition);

  const motor0 = armPosition[0] / 90;
  const motor1 = armPosition[1] / 180;
  const motor2 = -armPosition[2] / 90;

  const motor3 = armPosition[3] / 90 + 90;
  const motor4 = armPosition[4] / 90;
  const motor5 = armPosition[5] / 90 + 0.1;

  // Motor 2 and motor 1 are switched due to the positioning on the robot arm
  const position = { x: motor0, y: motor2, z: motor1 };
  const rotation = { alpha: motor3, beta: motor4, gamma: 0 };
  const tubeSize = motor5;

  const currentPosition = useRef({
    x: 0,
    y: 0,
    z: 0,
  });

  const currentRotation = useRef({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });

  useEffect(() => {
    currentPosition.current = { ...position };
    currentRotation.current = { ...rotation };
  }, [position, rotation]);

  useFrame((_, delta) => {
    if (!torusRef.current) return;
    torusRef.current.position.set(
      currentPosition.current.x,
      currentPosition.current.y,
      currentPosition.current.z
    );

    torusRef.current.rotation.set(
      currentRotation.current.alpha,
      currentRotation.current.beta,
      currentRotation.current.gamma
    );
  });

  return (
    <mesh
      ref={torusRef}
      position={[position.x, position.y, position.z]}
      rotation={[rotation.alpha, rotation.beta, rotation.gamma]}
    >
      <torusGeometry args={[1, tubeSize]} />
      <meshNormalMaterial />
    </mesh>
  );
}
