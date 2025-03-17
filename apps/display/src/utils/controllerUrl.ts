export async function getControllerUrl() {
  const envUrl = import.meta.env.VITE_REACT_APP_CONTROLLER_URL;
  if (envUrl) {
    return envUrl;
  }

  const filePath = "/tmp/network-address.txt";
  try {
    const response = await fetch(filePath);
    if (response.ok) {
      const networkAddress = await response.text();
      return networkAddress.trim();
    }
  } catch (error) {
    console.error("Failed to fetch network address:", error);
  }

  throw new Error("Controller URL not set in environment variable or file");
}
