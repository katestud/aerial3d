type DeviceData = {
  acceleration?: Acceleration;
  orientation?: Orientation;
  rotationRate?: RotationRate;
};

type Acceleration = {
  x: number;
  y: number;
  z: number;
};

type RotationRate = {
  alpha: number;
  beta: number;
  gamma: number;
};

type Orientation = {
  absolute?: boolean;
  alpha: number;
  beta: number;
  gamma: number;
};

export type { DeviceData, Acceleration, RotationRate, Orientation };
