import { Acceleration, Orientation, RotationRate } from "../types/device";

import { createContext } from "react";

type DisplayContextType = {
  acceleration: { current: Acceleration };
  orientation: { current: Orientation };
  rotationRate: { current: RotationRate };
};

export const DisplayContext = createContext<DisplayContextType>({
  acceleration: { current: { x: 0, y: 0, z: 0 } },
  orientation: { current: { alpha: 0, beta: 0, gamma: 0 } },
  rotationRate: { current: { alpha: 0, beta: 0, gamma: 0 } },
});
