"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import Webcam from "react-webcam";
import { FiBookOpen,FiCamera,FiRefreshCw } from "react-icons/fi";
import { anylizeAction } from "@/action/anylizeAction";

const usePotrait = () => {
  // Membaca layar user => Desktop / mobile
  const [Potrait, setIsPotrait] = useState(false);

  useEffect(() => {
    const screenMedia = window.matchMedia("(orientation: portrait)");

    const onChange = () => setIsPotrait(screenMedia.matches);
    onChange();
    screenMedia.addEventListener("change", onChange);
    return () => screenMedia.removeEventListener("change", onChange);
  }, []);
  return Potrait;
};

const Camera = () => {
  const webcamRef = useRef(null);
  const resultRef = useRef(null);
  const canvasRef = useRef(null);
  

  const [state, formAction] = React.useActionState(anylizeAction, {
  ok: false, 
  html: '',
  rid: ''
  })

  const ridRef = useRef("");
  const ridInputRef = useRef(null);

  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [typedHtml, setTypedHtml] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [responseHtml, setResponseHtml] = useState('')


  const isPotrait = usePotrait();
  
  const videoContrains = useMemo(
    () => ({
      facingMode: "user",
      frameRate: { ideal: 30, max: 60 },
    }),
    [isPotrait],
  );

  const capturePhoto = () => {
    // tombol jepret ( Menangkap foto User )
    setErrorMessage('')
    const video = webcamRef.current?.video;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth) {
      setErrorMessage("Kamera Belum Siap, Tunggu Bentar yaa!");
      return
    }

    const vw = video.videoWidth,
      vh = video.videoHeight;

    const targetW = isPotrait ? 720 : 1280;
    const targetH = isPotrait ? 1280 : 720;
    const srcAspect = vw / vh,
      dstAspect = targetW / targetH;

    let sx = 0,
      sy = 0,
      sw = vw,
      sh = vh;

    if (srcAspect > dstAspect) {
      sh = vh;
      sw = Math.round(vh * dstAspect);
      sx = Math.round((vw - sw) / 2);
    } else {
      sw = vw;
      sh = Math.round(vw / dstAspect);
      sy = Math.round((vh - sh) / 2);
    }

    canvas.width = targetW;
    canvas.height = targetH;

    const context = canvas.getContext("2d");
    context.save()
    context.scale(-1, 1)
    context.translate(-targetW, 0)
    context.drawImage(video, sx, sy, sw, sh,  0, 0, targetW, targetH);
    context.restore()
    


    const result = canvas.toDataURL("image/jpeg", 0.9);
    setPhotoDataUrl(result);
  };

  const retake = () => {
    setErrorMessage('')
    setPhotoDataUrl('')
    setResponseHtml('')
    setIsLoading(false)
    setIsTyping(false)
    setTypedHtml('')
    window?.scrollTo({top: 0, behavior: 'smooth'})
  }

  const onSubmit = (e) => {
    if(!photoDataUrl) {
      e.preventDefault()
      setErrorMessage('belum ada foto nihh !!')
      return
    }

    const rid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    ridRef.current = rid
    if(ridInputRef.current) ridInputRef.current.value = rid

    setIsLoading(true)
    setTypedHtml('')
    setIsTyping(true)
    setErrorMessage('')
  }

  useEffect(() => {
    if(!state.ok || String(state?.rid ?? '') !== String(ridRef.current)) return;

    const raw = typeof state.html === 'string' ? state.html : '';
    setIsLoading(false)
    
    if(!raw.trim()){
      setResponseHtml('')
      setTypedHtml('')
      setIsTyping(false)
      return;
    }

    setResponseHtml(raw)
    resultRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'})

    const parts = raw.split(/(?=<section)/g).filter(Boolean)

    let i = 0
    setTypedHtml('')
    setIsTyping(true)

    const step =() => {
      if(i >= parts.length){
        setIsTyping(false)
        return;
      }

      const chunk = String(parts[i ++] ?? '')
      if(!chunk) {
        setTimeout(step, 0)
        return
      }

      setTypedHtml((prev) => (String(prev ?? '') + chunk))
      setTimeout(step, 160)
    }
    step()
  },[state])

  const htmlToRender = cleanUpHTML(isTyping ? typedHtml :  responseHtml)
  console.log(htmlToRender)
  return (
    <div>
      <div className="relative rounded-xl overflow-hidden w-full">
        <Webcam
          ref={webcamRef}
          videoConstraints={videoContrains}
          audio={false}
          className={`w-full ${isPotrait ? "aspect-9/16" : "aspect-video"} object-cover `}
          mirrored
          screenshotQuality={0.9}
          screenshotFormat="image/jpeg"
        />
        {photoDataUrl && (
          <img src={photoDataUrl} alt="Capture" className="absolute inset-0 w-full h-full object-contain"/>
        )}

        <div className="absolute flex left-1/2 -translate-1/2 items-center gap-3 bottom-1 shadow">
          {!photoDataUrl ? (
            <button
              onClick={capturePhoto}
              className="text-gray-500 flex rounded-full hover:cursor-pointer bg-white justify-center h-14 w-14 items-center"
              title="Capture"
            >
              <FiCamera  className="h-6 w-6"/>
            </button>
          ) : (
            <button
              onClick={retake}
              className="text-gray-500 flex rounded-full hover:cursor-pointer bg-white justify-center h-14 w-14 items-center"
              title="Retake Foto"
            >
              <FiRefreshCw className="h-6 w-6"/>
            </button>
          )}
          <form action={formAction} onSubmit={onSubmit}>
            <input type="hidden" name="image" value={photoDataUrl} />
            <input
              ref={ridInputRef}
              type="hidden"
              name="rid"
              defaultValue={""}
            />

            <button
              type="submit"
              disabled={!photoDataUrl || isLoading}
              className={`px-4 h-14 text-white shadow-xl rounded-xl transition ${
                !photoDataUrl || isLoading
                  ? "text-gray-400"
                  : "bg-emerald-800 hover:bg-emerald-900"
              }`}
              title="analisis"
            >
              {isLoading ? "Wait..." : "Ramal"}
            </button>
          </form>
        </div>
      </div>
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      <canvas className="hidden" ref={canvasRef}></canvas>

              {/* result */}
      <section className="w-full" ref={resultRef}>
        <div className="p-6 shadow-2xl border border-gray-800 mt-6 rounded-xl bg-gray-700">
          <div className="flex items-center gap-3 mb-3 text-xl text-yellow-400">
            <FiBookOpen /> Hasil Ramalan
          </div>

          {
            isTyping && !typedHtml && (
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <span  className="bg-gray-500 h-2 w-2 rounded-full animate-pulse"/>
                <span  className="bg-gray-500 h-2 w-2 rounded-full animate-pulse [animation-delay:.15s]"/>
                <span  className="bg-gray-500 h-2 w-2 rounded-full animate-pulse [animation-delay:.3]"/>
              </div>
            )}

          {htmlToRender.trim() ? (
            <div className="text-base leading-6
                [&_section]:mt-5
                [&_h2]:mt-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:px-1
                [&_article]:mt-5
                [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-1
                "
                dangerouslySetInnerHTML={{__html: htmlToRender}}/>
          ) : (
            <div className="bg-gray-500 p-4 mt-2 rounded-xl">
              <p className="font-semibold text-white">Capture Lalu Tekan Ramal</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const cleanUpHTML = (html) => 
  String(html ?? '')
    .replace(/\bundefined\b\s*$/i, "")
    .replace(/<\/section>\s*undefined\s*$/i, '</section>') 

export default Camera;