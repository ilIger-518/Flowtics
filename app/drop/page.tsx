"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

type FileWithPreview = File & { preview?: string };

export default function DropPage() {
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
    maxFiles: 10,
  });

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    try {
      await fetch("/api/upload", { method: "POST", body: form });
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
          className="rounded-lg border-2 border-dashed border-border bg-card p-8 text-center"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the images here...</p>
          ) : (
            <p>Drag and drop images here, or click to select files</p>
          )}
+          <p className="mt-2 text-xs text-muted-foreground">
+            Up to 10 files per batch.
+          </p>
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
            className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <button
            onClick={() => setFiles([])}
            className="rounded border border-border px-4 py-2"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
