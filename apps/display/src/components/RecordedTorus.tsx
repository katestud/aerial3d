import * as THREE from "three";

import { useEffect, useRef } from "react";

import { DeviceData } from "../types/device";
import { useFrame } from "@react-three/fiber";

type RecordedTorusProps = {
  position: { x: number; y: number; z: number };
  rotation: { alpha: number; beta: number; gamma: number };
  data: DeviceData[];
  playbackRate?: number;
  useAcceleration: boolean;
};

export function RecordedTorus({
  position,
  rotation,
  data,
  playbackRate = 1,
  useAcceleration,
}: RecordedTorusProps) {
  const torusRef = useRef<THREE.Mesh>(null);
  const elapsedTime = useRef(0);
  const currentIndex = useRef(0);

  const velocity = useRef({ x: 0, y: 0, z: 0 });
  const currentPosition = useRef({
    x: position.x,
    y: position.y,
    z: position.z,
  });

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
    if (!torusRef.current || !data.length) return;

    elapsedTime.current += delta * playbackRate;

    // Assuming 208Hz data rate
    const targetIndex = Math.floor(elapsedTime.current * 208);
    currentIndex.current = targetIndex % data.length;

    const currentData = data[currentIndex.current];
    console.log("currentData", currentData);

    const targetAccel = currentData.acceleration;
    const targetRotationRate = currentData.rotationRate;

    if (useAcceleration && targetAccel) {
      // Convert acceleration to velocity
      velocity.current = {
        x: velocity.current.x + targetAccel.x * delta,
        y: velocity.current.y + targetAccel.y * delta,
        z: velocity.current.z + targetAccel.z * delta,
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

    if (targetRotationRate) {
      currentRotation.current = {
        alpha: currentRotation.current.alpha + targetRotationRate.alpha * delta,
        beta: currentRotation.current.beta + targetRotationRate.beta * delta,
        gamma: currentRotation.current.gamma + targetRotationRate.gamma * delta,
      };
    }

    torusRef.current.rotation.set(
      THREE.MathUtils.degToRad(currentRotation.current.alpha),
      THREE.MathUtils.degToRad(currentRotation.current.beta),
      THREE.MathUtils.degToRad(currentRotation.current.gamma)
    );
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
