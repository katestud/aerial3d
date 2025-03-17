import { DeviceData } from "../types/device";

export function parseCSVToDeviceData(csvText: string): DeviceData[] {
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const data: DeviceData = {};

    data.acceleration = {
      x: parseFloat(values[headers.indexOf("X")]),
      y: parseFloat(values[headers.indexOf("Y")]),
      z: parseFloat(values[headers.indexOf("Z")]),
    };

    data.rotationRate = {
      alpha: parseFloat(values[headers.indexOf("Rx")]),
      beta: parseFloat(values[headers.indexOf("Ry")]),
      gamma: parseFloat(values[headers.indexOf("Rz")]),
    };

    return data;
  });
}
