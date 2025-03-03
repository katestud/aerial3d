import { MathUtils } from 'three';

export const fetch6DoFData = async (setData) => {
  try {
    const response = await fetch('/data.csv');
    if (!response.ok) {
      throw new Error('Failed to fetch CSV file');
    }

    const csv = await response.text(); // Wait for the CSV content to be fetched
    const rows = csv.trim().split('\n').slice(1); // Skip the header row
    const parsedData = rows.map((row) => {
      const [, x, y, z, degX, degY, degZ] = row.split(',').map(Number);
      const rx = MathUtils.degToRad(degX);
      const ry = MathUtils.degToRad(degY);
      const rz = MathUtils.degToRad(degZ);
      return { x, y, z, rx, ry, rz };
    });

    setData(parsedData)
  } catch (error) {
    console.error('Error fetching 6DoF data:', error);
    setData([])
  }
};
