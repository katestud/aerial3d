import { useEffect, useState } from "react";

export function RecordingFileList({
  onFileSelect,
}: {
  onFileSelect: (file: string) => void;
}) {
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/recordings")
      .then((response) => response.json())
      .then((data) => {
        const csvFiles = data.filter((file: string) => file.endsWith(".csv"));
        setFiles(csvFiles);
      })
      .catch((err) => {
        console.error("Failed to load recordings:", err);
        setError("Failed to load recordings");
      });
  }, []);

  if (error) {
    return <div className="file-list-error">{error}</div>;
  }

  return (
    <div className="file-list">
      <h2>Select a Recording</h2>
      {files.length === 0 ? (
        <p>Loading recordings...</p>
      ) : (
        <ul>
          {files.map((file) => (
            <li key={file}>
              <button onClick={() => onFileSelect(`/recordings/${file}`)}>
                {file.replace(/\.[^/.]+$/, "")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
