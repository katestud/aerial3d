import { Acceleration, Orientation, RotationRate } from "../types/device";
import { MutableRefObject, createContext } from "react";

type DisplayContextType = {
  acceleration: MutableRefObject<Acceleration>;
  orientation: MutableRefObject<Orientation>;
  rotationRate: MutableRefObject<RotationRate>;
};

export const DisplayContext = createContext<DisplayContextType>({
  acceleration: { current: { x: 0, y: 0, z: 0 } },
  orientation: { current: { alpha: 0, beta: 0, gamma: 0 } },
  rotationRate: { current: { alpha: 0, beta: 0, gamma: 0 } },
});
