"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

type FileWithPreview = File & { preview?: string };

export default function Page() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const mapped = acceptedFiles.map((file) => {
      const f = file as FileWithPreview;
      f.preview = URL.createObjectURL(file);
      return f;
    });
    setFiles((prev) => [...prev, ...mapped]);
  }, []);

  useEffect(() => {
    return () => {
      files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    try {
      await fetch("/api/upload", { method: "POST", body: form });
      // simple success feedback
      setFiles([]);
      alert("Upload complete");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div
          {...getRootProps()}
          className="border-2 border-dashed p-8 rounded text-center cursor-pointer"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the images here...</p>
          ) : (
            <p>Drag 'n' drop images here, or click to select files</p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {files.map((file, idx) => (
            <div key={idx} className="h-24 w-24 overflow-hidden rounded bg-gray-100">
              {file.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.preview} alt={file.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <button onClick={() => setFiles([])} className="px-4 py-2 border rounded">
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
