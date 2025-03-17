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
  onTimeUpdate?: (time: number) => void;
  isPlaying: boolean;
};

export function RecordedTorus({
  position,
  rotation,
  data,
  playbackRate = 1,
  useAcceleration,
  onTimeUpdate,
  isPlaying,
}: RecordedTorusProps) {
  const torusRef = useRef<THREE.Mesh>(null);
  const elapsedTime = useRef(0);
  const currentIndex = useRef(0);
  const quaternion = useRef(new THREE.Quaternion());
  const gyroBias = useRef(new THREE.Vector3(0, 0, 0)); // Stores gyro drift correction
  const velocity = useRef(new THREE.Vector3());
  const currentPosition = useRef(
    new THREE.Vector3(position.x, position.y, position.z)
  );

  useEffect(() => {
    currentPosition.current.set(position.x, position.y, position.z);
    quaternion.current.setFromEuler(
      new THREE.Euler(
        THREE.MathUtils.degToRad(rotation.alpha),
        THREE.MathUtils.degToRad(rotation.beta),
        THREE.MathUtils.degToRad(rotation.gamma)
      )
    );
  }, []);

  useEffect(() => {
    currentPosition.current.set(position.x, position.y, position.z);
  }, [position]);

  useFrame((_, delta) => {
    if (!torusRef.current || !data.length) return;

    if (isPlaying) {
      elapsedTime.current += delta * playbackRate;
      onTimeUpdate?.(elapsedTime.current);

      const targetIndex = Math.floor(elapsedTime.current * 208);
      currentIndex.current = targetIndex % data.length;

      const currentData = data[currentIndex.current];
      if (!currentData) return;

      const { acceleration, rotationRate } = currentData;

      if (useAcceleration && acceleration) {
        const ACCEL_SCALE = 16384;
        const GRAVITY = 9.81;

        const accelVector = new THREE.Vector3(
          (acceleration.x / ACCEL_SCALE) * GRAVITY,
          (acceleration.y / ACCEL_SCALE) * GRAVITY,
          (acceleration.z / ACCEL_SCALE) * GRAVITY
        );

        velocity.current.addScaledVector(accelVector, delta);
        velocity.current.multiplyScalar(0.95);

        currentPosition.current.addScaledVector(velocity.current, delta);
        torusRef.current.position.copy(currentPosition.current);
      }

      if (rotationRate) {
        const GYRO_SCALE = 16.4;
        const SENSITIVITY_REDUCTION = 0.2;
        const GYRO_BIAS_CORRECTION = 0.001;

        const omega = new THREE.Vector3(
          (rotationRate.alpha / GYRO_SCALE) * SENSITIVITY_REDUCTION,
          (rotationRate.beta / GYRO_SCALE) * SENSITIVITY_REDUCTION,
          (rotationRate.gamma / GYRO_SCALE) * SENSITIVITY_REDUCTION
        ).multiplyScalar(THREE.MathUtils.degToRad(1)); // Convert to radians

        // Apply gyro drift correction
        const correctedOmega = omega.clone().sub(gyroBias.current);

        const deltaQuat = new THREE.Quaternion(
          correctedOmega.x * delta * 0.5,
          correctedOmega.y * delta * 0.5,
          correctedOmega.z * delta * 0.5,
          1
        ).normalize();

        quaternion.current.multiply(deltaQuat).normalize();

        // Slowly adjust the bias towards the measured gyro values
        gyroBias.current.lerp(omega, GYRO_BIAS_CORRECTION);

        if (useAcceleration && acceleration) {
          const accelPitch = Math.atan2(
            -acceleration.x,
            Math.sqrt(acceleration.y ** 2 + acceleration.z ** 2)
          );
          const accelRoll = Math.atan2(acceleration.y, acceleration.z);

          const accelQuat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(accelPitch, accelRoll, 0)
          );

          quaternion.current.slerp(accelQuat, 0.05);
        }

        torusRef.current.quaternion.copy(quaternion.current);
      }
    }
  });

  return (
    <mesh
      ref={torusRef}
      position={new THREE.Vector3(position.x, position.y, position.z)}
    >
      <boxGeometry args={[2, 3, 2]} />
      <meshNormalMaterial />
    </mesh>
  );
}
