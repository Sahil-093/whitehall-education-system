"use client";

import { useEffect, useRef, useState } from "react";
import { DRIVE_PHOTOS_URL } from "@/lib/school-links";

function drawPhoto(source: CanvasImageSource, width: number, height: number) {
  const max = 640;
  const scale = Math.min(1, max / Math.max(width, height, 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) return "";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

function fileToPhoto(file: File) {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const data = drawPhoto(image, image.naturalWidth, image.naturalHeight);
      URL.revokeObjectURL(url);
      if (!data) reject(new Error("That photo could not be read."));
      else resolve(data);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That photo could not be read. Try a JPG or PNG."));
    };
    image.src = url;
  });
}

export function StudentPhoto({
  photo,
  fileName,
  onChange,
}: {
  photo: string;
  fileName: string;
  onChange: (photo: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");

  function stop() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setLive(false);
  }

  useEffect(() => {
    if (live && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [live]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function startCamera() {
    setError("");
    stop();
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setLive(true);
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        setLive(true);
      } catch {
        cameraRef.current?.click();
      }
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const data = drawPhoto(video, video.videoWidth, video.videoHeight);
    if (!data) {
      setError("The photo could not be taken. Try again.");
      return;
    }
    onChange(data);
    stop();
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      onChange(await fileToPhoto(file));
      stop();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That photo could not be read.");
    }
  }

  return (
    <section className="card stack">
      <h2>Student photo</h2>
      <div className="photo-row">
        <div className="photo-frame">
          {photo ? <img src={photo} alt="Student" /> : <span>No photo yet</span>}
        </div>
        <div className="stack">
          <div className="photo-actions">
            <button type="button" className="btn secondary" onClick={() => fileRef.current?.click()}>
              Upload photo
            </button>
            <button type="button" className="btn secondary" onClick={() => void startCamera()}>
              Take photo
            </button>
            {photo ? (
              <button type="button" className="btn secondary" onClick={() => onChange("")}>
                Remove photo
              </button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void onFile(file);
            }}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="user"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void onFile(file);
            }}
          />
          {live ? (
            <>
              <video ref={videoRef} className="photo-live" autoPlay playsInline muted />
              <div className="photo-actions">
                <button type="button" className="btn" onClick={capture}>
                  Use this photo
                </button>
                <button type="button" className="btn secondary" onClick={stop}>
                  Cancel camera
                </button>
              </div>
            </>
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          <p className="edit-note">
            Upload a saved picture, or take one with the camera. It is stored in{" "}
            <a href={DRIVE_PHOTOS_URL} target="_blank" rel="noreferrer">
              Student photos
            </a>{" "}
            as {fileName ? `${fileName}.jpg` : "this student's name"}. A copy stays on this computer so this page can show it.
          </p>
        </div>
      </div>
    </section>
  );
}
