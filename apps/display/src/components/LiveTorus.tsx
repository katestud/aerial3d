import * as THREE from "three";

import { useContext, useEffect, useRef } from "react";

import { DisplayContext } from "../context/DisplayContext";
import { useFrame } from "@react-three/fiber";

type LiveTorusProps = {
  position: { x: number; y: number; z: number };
  rotation: { alpha: number; beta: number; gamma: number };
  useOrientation: boolean;
  useAcceleration: boolean;
};

export function LiveTorus({
  position,
  rotation,
  useOrientation,
  useAcceleration,
}: LiveTorusProps) {
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
