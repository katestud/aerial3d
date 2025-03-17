import { useEffect, useState } from "react";

import recordings from "virtual:recordings-list";

export function RecordingFileList({
  onFileSelect,
}: {
  onFileSelect: (file: string) => void;
}) {
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ...in your component
  useEffect(() => {
    setFiles(recordings);
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
                {file.replace(/\.csv$/, "")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
