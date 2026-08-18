"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface BluetoothCharacteristicLike {
  startNotifications(): Promise<BluetoothCharacteristicLike>;
  stopNotifications(): Promise<BluetoothCharacteristicLike>;
  addEventListener(type: "characteristicvaluechanged", listener: (event: Event) => void): void;
  removeEventListener(type: "characteristicvaluechanged", listener: (event: Event) => void): void;
}

interface BluetoothRemoteGATTServerLike {
  connected?: boolean;
  connect(): Promise<BluetoothRemoteGATTServerLike>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<{
    getCharacteristic(characteristic: string): Promise<BluetoothCharacteristicLike>;
  }>;
}

interface BluetoothDeviceLike {
  name?: string;
  gatt?: BluetoothRemoteGATTServerLike;
  addEventListener(type: "gattserverdisconnected", listener: () => void): void;
  removeEventListener(type: "gattserverdisconnected", listener: () => void): void;
}

interface WebBluetoothLike {
  requestDevice(options: { filters: { services: string[] }[] }): Promise<BluetoothDeviceLike>;
}

interface CircuitSegment {
  id: number;
  name: string;
  minutes: number;
  startPercent: number;
  endPercent: number;
}

interface CircuitTemplate {
  name: string;
  difficulty: "Media" | "Exigente";
  focus: string;
  segments: Omit<CircuitSegment, "id">[];
}

interface WorkoutHistory {
  id: number;
  date: string;
  circuit: string;
  durationSeconds: number;
  averageHeartRate: number;
  maximumHeartRate: number;
  completed: boolean;
}

const circuitTemplates: CircuitTemplate[] = [
  { name: "Fondo progresivo", difficulty: "Media", focus: "Base aeróbica y resistencia", segments: [
    { name: "Calentamiento", minutes: 10, startPercent: 50, endPercent: 65 },
    { name: "Ritmo aeróbico", minutes: 10, startPercent: 66, endPercent: 74 },
    { name: "Recuperación", minutes: 5, startPercent: 62, endPercent: 65 },
    { name: "Subida sostenida", minutes: 10, startPercent: 70, endPercent: 80 },
    { name: "Recuperación", minutes: 5, startPercent: 62, endPercent: 66 },
    { name: "Fondo estable", minutes: 12, startPercent: 70, endPercent: 76 },
    { name: "Enfriamiento", minutes: 8, startPercent: 65, endPercent: 50 },
  ]},
  { name: "Colinas controladas", difficulty: "Media", focus: "Cambios de ritmo sin zona máxima", segments: [
    { name: "Calentamiento", minutes: 10, startPercent: 50, endPercent: 65 },
    { name: "Colina 1", minutes: 7, startPercent: 68, endPercent: 78 },
    { name: "Valle", minutes: 3, startPercent: 64, endPercent: 66 },
    { name: "Colina 2", minutes: 8, startPercent: 68, endPercent: 82 },
    { name: "Valle", minutes: 4, startPercent: 63, endPercent: 66 },
    { name: "Colina 3", minutes: 8, startPercent: 70, endPercent: 83 },
    { name: "Recuperación", minutes: 4, startPercent: 62, endPercent: 65 },
    { name: "Tempo final", minutes: 8, startPercent: 70, endPercent: 77 },
    { name: "Enfriamiento", minutes: 8, startPercent: 64, endPercent: 50 },
  ]},
  { name: "Umbral 3×8", difficulty: "Exigente", focus: "Tolerancia al esfuerzo sostenido", segments: [
    { name: "Calentamiento", minutes: 10, startPercent: 50, endPercent: 72 },
    { name: "Umbral 1", minutes: 8, startPercent: 78, endPercent: 86 },
    { name: "Recuperación", minutes: 4, startPercent: 62, endPercent: 68 },
    { name: "Umbral 2", minutes: 8, startPercent: 80, endPercent: 87 },
    { name: "Recuperación", minutes: 4, startPercent: 62, endPercent: 68 },
    { name: "Umbral 3", minutes: 8, startPercent: 80, endPercent: 88 },
    { name: "Recuperación", minutes: 4, startPercent: 62, endPercent: 66 },
    { name: "Remate", minutes: 6, startPercent: 82, endPercent: 90 },
    { name: "Enfriamiento", minutes: 8, startPercent: 65, endPercent: 50 },
  ]},
  { name: "Pirámide roja", difficulty: "Exigente", focus: "Potencia aeróbica progresiva", segments: [
    { name: "Calentamiento", minutes: 10, startPercent: 50, endPercent: 70 },
    { name: "Carga 3", minutes: 3, startPercent: 80, endPercent: 86 }, { name: "Recuperación", minutes: 2, startPercent: 62, endPercent: 66 },
    { name: "Carga 4", minutes: 4, startPercent: 82, endPercent: 88 }, { name: "Recuperación", minutes: 2, startPercent: 62, endPercent: 66 },
    { name: "Cima 5", minutes: 5, startPercent: 84, endPercent: 91 }, { name: "Recuperación", minutes: 3, startPercent: 60, endPercent: 65 },
    { name: "Cima 5", minutes: 5, startPercent: 84, endPercent: 91 }, { name: "Recuperación", minutes: 2, startPercent: 62, endPercent: 66 },
    { name: "Carga 4", minutes: 4, startPercent: 82, endPercent: 88 }, { name: "Recuperación", minutes: 2, startPercent: 62, endPercent: 66 },
    { name: "Carga 3", minutes: 3, startPercent: 80, endPercent: 87 },
    { name: "Tempo", minutes: 5, startPercent: 72, endPercent: 78 },
    { name: "Enfriamiento", minutes: 10, startPercent: 65, endPercent: 50 },
  ]},
  { name: "Olas HIIT", difficulty: "Exigente", focus: "Intervalos cortos y recuperación activa", segments: [
    { name: "Calentamiento", minutes: 10, startPercent: 50, endPercent: 72 },
    ...Array.from({ length: 5 }, (_, index) => [
      { name: `Ola ${index + 1}`, minutes: 3, startPercent: 82, endPercent: 90 },
      { name: "Recuperación", minutes: 2, startPercent: 60, endPercent: 66 },
    ]).flat(),
    { name: "Tempo", minutes: 5, startPercent: 72, endPercent: 78 },
    ...Array.from({ length: 5 }, (_, index) => [
      { name: `Sprint ${index + 1}`, minutes: 1, startPercent: 88, endPercent: 94 },
      { name: "Recuperación", minutes: 1, startPercent: 58, endPercent: 64 },
    ]).flat(),
    { name: "Umbral final", minutes: 5, startPercent: 80, endPercent: 88 },
    { name: "Enfriamiento", minutes: 5, startPercent: 64, endPercent: 50 },
  ]},
];

const zones = [
  { name: "Zona 5", range: "90–100%", color: "#ef4444" },
  { name: "Zona 4", range: "80–89%", color: "#f97316" },
  { name: "Zona 3", range: "70–79%", color: "#facc15" },
  { name: "Zona 2", range: "60–69%", color: "#65d83f" },
  { name: "Zona 1", range: "50–59%", color: "#1db7d8" },
];

export default function Home() {
  const [activeView, setActiveView] = useState("Entrenar");
  const [heartRate, setHeartRate] = useState(145);
  const [ageInput, setAgeInput] = useState("47");
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [sensorName, setSensorName] = useState("HRM 200");
  const [connectionMessage, setConnectionMessage] = useState("");
  const characteristicRef = useRef<BluetoothCharacteristicLike | null>(null);
  const deviceRef = useRef<BluetoothDeviceLike | null>(null);
  const heartRateListenerRef = useRef<((event: Event) => void) | null>(null);
  const disconnectListenerRef = useRef<(() => void) | null>(null);
  const latestHeartRateRef = useRef(145);
  const [circuitName, setCircuitName] = useState("Mi circuito");
  const [sessionState, setSessionState] = useState<"ready" | "running" | "paused">("ready");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [history, setHistory] = useState<WorkoutHistory[]>([]);
  const heartRateTotalRef = useRef(0);
  const heartRateSamplesRef = useRef(0);
  const sessionMaximumRef = useRef(0);
  const [segments, setSegments] = useState<CircuitSegment[]>([
    { id: 1, name: "Calentamiento", minutes: 5, startPercent: 50, endPercent: 65 },
    { id: 2, name: "Subida", minutes: 4, startPercent: 65, endPercent: 82 },
    { id: 3, name: "Recuperación", minutes: 2, startPercent: 65, endPercent: 65 },
  ]);
  const parsedAge = Number(ageInput);
  const age = Number.isFinite(parsedAge) && parsedAge >= 15 && parsedAge <= 90 ? parsedAge : 47;
  const maximumHeartRate = 220 - age;
  const totalSeconds = segments.reduce((total, segment) => total + segment.minutes * 60, 0);
  const percentage = Math.round((heartRate / maximumHeartRate) * 100);
  const activeZone = useMemo(() => {
    if (percentage >= 90) return zones[0];
    if (percentage >= 80) return zones[1];
    if (percentage >= 70) return zones[2];
    if (percentage >= 60) return zones[3];
    return zones[4];
  }, [percentage]);

  const workoutPosition = useMemo(() => {
    let passed = 0;
    for (let index = 0; index < segments.length; index += 1) {
      const duration = segments[index].minutes * 60;
      if (elapsedSeconds < passed + duration || index === segments.length - 1) {
        const ratio = Math.min(1, Math.max(0, (elapsedSeconds - passed) / Math.max(duration, 1)));
        const target = Math.round(segments[index].startPercent + (segments[index].endPercent - segments[index].startPercent) * ratio);
        return { segment: segments[index], index, target };
      }
      passed += duration;
    }
    return { segment: undefined, index: 0, target: 0 };
  }, [elapsedSeconds, segments]);

  useEffect(() => {
    const savedAge = localStorage.getItem("spinzone-age");
    const savedSegments = localStorage.getItem("spinzone-segments");
    const savedName = localStorage.getItem("spinzone-circuit-name");
    const savedHistory = localStorage.getItem("spinzone-history");
    if (savedAge) setAgeInput(savedAge);
    if (savedSegments) setSegments(JSON.parse(savedSegments));
    if (savedName) setCircuitName(savedName);
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");
  }, []);

  useEffect(() => { localStorage.setItem("spinzone-age", ageInput); }, [ageInput]);
  useEffect(() => { localStorage.setItem("spinzone-segments", JSON.stringify(segments)); }, [segments]);
  useEffect(() => { localStorage.setItem("spinzone-circuit-name", circuitName); }, [circuitName]);
  useEffect(() => { localStorage.setItem("spinzone-history", JSON.stringify(history)); }, [history]);

  useEffect(() => () => {
    const characteristic = characteristicRef.current;
    const heartRateListener = heartRateListenerRef.current;
    const device = deviceRef.current;
    const disconnectListener = disconnectListenerRef.current;
    if (characteristic && heartRateListener) {
      characteristic.removeEventListener("characteristicvaluechanged", heartRateListener);
      void characteristic.stopNotifications().catch(() => undefined);
    }
    if (device && disconnectListener) device.removeEventListener("gattserverdisconnected", disconnectListener);
    device?.gatt?.disconnect();
  }, []);

  useEffect(() => {
    if (sessionState !== "running") return;
    const timer = window.setInterval(() => {
      heartRateTotalRef.current += latestHeartRateRef.current;
      heartRateSamplesRef.current += 1;
      sessionMaximumRef.current = Math.max(sessionMaximumRef.current, latestHeartRateRef.current);
      setElapsedSeconds((current) => Math.min(current + 1, totalSeconds));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sessionState, totalSeconds]);

  useEffect(() => {
    if (sessionState === "running" && totalSeconds > 0 && elapsedSeconds >= totalSeconds) finishWorkout(true);
  }, [elapsedSeconds, sessionState, totalSeconds]);

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function startWorkout() {
    if (!segments.length) return;
    if (sessionState === "ready") {
      setElapsedSeconds(0);
      heartRateTotalRef.current = 0;
      heartRateSamplesRef.current = 0;
      sessionMaximumRef.current = 0;
    }
    setSessionState("running");
  }

  function finishWorkout(completed = false) {
    if (elapsedSeconds > 0) {
      const result: WorkoutHistory = {
        id: Date.now(), date: new Date().toISOString(), circuit: circuitName,
        durationSeconds: elapsedSeconds,
        averageHeartRate: heartRateSamplesRef.current ? Math.round(heartRateTotalRef.current / heartRateSamplesRef.current) : heartRate,
        maximumHeartRate: sessionMaximumRef.current || heartRate, completed,
      };
      setHistory((current) => [result, ...current]);
    }
    setSessionState("ready");
    setElapsedSeconds(0);
  }

  function readHeartRate(event: Event) {
    const value = (event.target as EventTarget & { value: DataView }).value;
    const flags = value.getUint8(0);
    const isSixteenBit = (flags & 0x01) !== 0;
    const bpm = isSixteenBit ? value.getUint16(1, true) : value.getUint8(1);
    latestHeartRateRef.current = bpm;
    setHeartRate(bpm);
  }

  async function disconnectHeartRateMonitor() {
    const characteristic = characteristicRef.current;
    const heartRateListener = heartRateListenerRef.current;
    const device = deviceRef.current;
    const disconnectListener = disconnectListenerRef.current;

    if (characteristic && heartRateListener) {
      characteristic.removeEventListener("characteristicvaluechanged", heartRateListener);
      try {
        await characteristic.stopNotifications();
      } catch {
        // The sensor may already have stopped sending notifications.
      }
    }
    if (device && disconnectListener) device.removeEventListener("gattserverdisconnected", disconnectListener);
    device?.gatt?.disconnect();
    characteristicRef.current = null;
    heartRateListenerRef.current = null;
    disconnectListenerRef.current = null;
    deviceRef.current = null;
    setConnectionStatus("idle");
    setConnectionMessage("HRM desconectado. Puedes volver a conectarlo cuando quieras.");
  }

  async function connectHeartRateMonitor() {
    const bluetooth = (navigator as Navigator & { bluetooth?: WebBluetoothLike }).bluetooth;
    if (!bluetooth) {
      setConnectionStatus("error");
      setConnectionMessage("Este navegador no permite Bluetooth. Usa Chrome en Mac o Bluefy en iPhone.");
      return;
    }

    try {
      setConnectionStatus("connecting");
      setConnectionMessage("Selecciona tu HRM 200 en la ventana del navegador.");
      const device = await bluetooth.requestDevice({ filters: [{ services: ["heart_rate"] }] });
      deviceRef.current = device;
      const server = await device.gatt?.connect();
      if (!server) throw new Error("No se pudo abrir la conexión Bluetooth.");
      const service = await server.getPrimaryService("heart_rate");
      const characteristic = await service.getCharacteristic("heart_rate_measurement");
      characteristicRef.current = characteristic;
      heartRateListenerRef.current = readHeartRate;
      characteristic.addEventListener("characteristicvaluechanged", heartRateListenerRef.current);
      await characteristic.startNotifications();
      disconnectListenerRef.current = () => {
        characteristicRef.current = null;
        heartRateListenerRef.current = null;
        disconnectListenerRef.current = null;
        deviceRef.current = null;
        setConnectionStatus("idle");
        setConnectionMessage("HRM desconectado. Pulsa conectar para intentarlo otra vez.");
      };
      device.addEventListener("gattserverdisconnected", disconnectListenerRef.current);
      setSensorName(device.name || "HRM 200");
      setConnectionStatus("connected");
      setConnectionMessage("Recibiendo tu frecuencia cardiaca en tiempo real.");
    } catch (error) {
      const characteristic = characteristicRef.current;
      const heartRateListener = heartRateListenerRef.current;
      const device = deviceRef.current;
      if (characteristic && heartRateListener) {
        characteristic.removeEventListener("characteristicvaluechanged", heartRateListener);
        void characteristic.stopNotifications().catch(() => undefined);
      }
      device?.gatt?.disconnect();
      characteristicRef.current = null;
      heartRateListenerRef.current = null;
      disconnectListenerRef.current = null;
      deviceRef.current = null;
      setConnectionStatus("error");
      setConnectionMessage(error instanceof Error ? error.message : "No se pudo conectar con el sensor.");
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">SPINZONE</span>
          <h1>Entrena por pulso,<br />no por adivinanzas.</h1>
        </div>
        <div className="topbar-actions">
          <a className="music-button" href="https://music.youtube.com/" target="_blank" rel="noopener noreferrer" aria-label="Abrir YouTube Music en una pestaña nueva">
            <span aria-hidden="true">♫</span> YouTube Music
          </a>
          <button className={`sensor-button ${connectionStatus}`} type="button"
            onClick={connectionStatus === "connected" ? disconnectHeartRateMonitor : connectHeartRateMonitor}
            disabled={connectionStatus === "connecting"}>
            <span className="status-dot" />
            {connectionStatus === "connected" ? `Desconectar ${sensorName}` : connectionStatus === "connecting" ? "Conectando…" : "Conectar HRM 200"}
          </button>
        </div>
      </header>

      {activeView === "Entrenar" && connectionMessage && <p className={`connection-message ${connectionStatus}`}>{connectionMessage}</p>}

      {activeView === "Entrenar" && <section className="workout-card">
        <div className="session-head">
          <div>
            <span className="label">{workoutPosition.segment ? `TRAMO ${workoutPosition.index + 1} DE ${segments.length}` : "SIN CIRCUITO"}</span>
            <strong>{workoutPosition.segment?.name || "Selecciona o diseña un circuito"}</strong>
          </div>
          <div className="timer">{formatTime(elapsedSeconds)} <small>/ {formatTime(totalSeconds)}</small></div>
        </div>

        <div className="chart-legend">
          <span><i className="actual-swatch" />Tu frecuencia real</span>
          <span><i className="target-swatch" />Frecuencia objetivo</span>
        </div>

        <div className="chart" aria-label="Perfil del circuito por zonas cardiacas">
          {zones.map((zone) => (
            <div className="zone-row" style={{ background: zone.color }} key={zone.name}>
              <span>{zone.name}</span><small>{zone.range}</small>
            </div>
          ))}
          <div className="planned-profile" aria-hidden="true">
            {segments.map((segment) => (
              <div className="planned-segment" key={segment.id} style={{ flexGrow: segment.minutes }}>
                <i style={{
                  clipPath: `polygon(0 ${100 - Math.max(0, segment.startPercent - 50) * 2}%, 100% ${100 - Math.max(0, segment.endPercent - 50) * 2}%, 100% 100%, 0 100%)`,
                }} />
              </div>
            ))}
          </div>
          <div className="progress-marker" style={{ left: `max(82px, calc(${totalSeconds ? Math.min(100, elapsedSeconds / totalSeconds * 100) : 0}% - 8px))` }} />
          <div className="target-point" title={`Objetivo: ${workoutPosition.target}%`} style={{ left: `max(82px, calc(${totalSeconds ? Math.min(100, elapsedSeconds / totalSeconds * 100) : 0}% - 10px))`, bottom: `${Math.min(98, Math.max(2, (workoutPosition.target - 50) * 2))}%` }}><span>{workoutPosition.target}%</span></div>
          <div className="current-point" title={`Real: ${percentage}%`} style={{ left: `max(82px, calc(${totalSeconds ? Math.min(100, elapsedSeconds / totalSeconds * 100) : 0}% - 10px))`, bottom: `${Math.min(98, Math.max(2, (percentage - 50) * 2))}%` }}><span>{percentage}%</span></div>
          <div className="time-axis" aria-label="Tiempo del circuito">
            {[0, .25, .5, .75, 1].map((position) => (
              <span key={position} style={{ left: `${position * 100}%` }}>{formatTime(Math.round(totalSeconds * position))}</span>
            ))}
          </div>
        </div>

        <div className="metrics">
          <div className="pulse">
            <span className="heart">♥</span>
            <strong>{heartRate}</strong>
            <small>ppm</small>
          </div>
          <div className="percent" style={{ color: activeZone.color }}>
            <strong>{percentage}%</strong>
            <span>{activeZone.name}</span>
          </div>
          <div className="target">
            <span>OBJETIVO ACTUAL</span>
            <strong>{workoutPosition.target}%</strong>
          </div>
        </div>

        <div className="workout-controls">
          {sessionState === "ready" && <button className="start-button" type="button" onClick={startWorkout} disabled={!segments.length}>▶ Iniciar</button>}
          {sessionState === "running" && <button className="pause-button" type="button" onClick={() => setSessionState("paused")}>Ⅱ Pausar</button>}
          {sessionState === "paused" && <button className="start-button" type="button" onClick={startWorkout}>▶ Reanudar</button>}
          {sessionState !== "ready" && <button className="stop-button" type="button" onClick={() => finishWorkout(false)}>■ Stop</button>}
        </div>

        <div className="profile-settings">
          <label>
            <span>Tu edad</span>
            <div className="age-field">
              <input type="number" inputMode="numeric" min="15" max="90" value={ageInput}
                onChange={(event) => setAgeInput(event.target.value)}
                onBlur={() => setAgeInput(String(age))} />
              <small>años</small>
            </div>
          </label>
          <div>
            <span>FC máxima estimada</span>
            <strong>{maximumHeartRate} ppm</strong>
          </div>
          <p>% actual = {heartRate} ÷ {maximumHeartRate} × 100</p>
        </div>

        <label className={`simulator ${connectionStatus === "connected" ? "disabled" : ""}`}>
          <span>Simular frecuencia cardiaca</span>
          <input type="range" min="80" max="195" value={heartRate}
            disabled={connectionStatus === "connected"}
            onChange={(event) => {
              const bpm = Number(event.target.value);
              latestHeartRateRef.current = bpm;
              setHeartRate(bpm);
            }} />
        </label>
      </section>}

      {activeView === "Circuitos" && <CircuitEditor segments={segments} setSegments={setSegments}
        circuitName={circuitName} setCircuitName={setCircuitName} onTrain={() => setActiveView("Entrenar")} />}

      {activeView === "Historial" && <HistoryView history={history} formatTime={formatTime} />}

      {activeView === "Ajustes" && (
        <section className="empty-view">
          <span className="eyebrow">AJUSTES</span>
          <h2>Perfil cardiaco</h2>
          <p>Edad: {age} años · Frecuencia máxima estimada: {maximumHeartRate} ppm.</p>
        </section>
      )}

      <nav className="bottom-nav" aria-label="Navegación principal">
        {["Entrenar", "Circuitos", "Historial", "Ajustes"].map((view) => (
          <button key={view} className={activeView === view ? "active" : ""} onClick={() => setActiveView(view)}>{view}</button>
        ))}
      </nav>
    </main>
  );
}

function CircuitEditor({ segments, setSegments, circuitName, setCircuitName, onTrain }: {
  segments: CircuitSegment[];
  setSegments: React.Dispatch<React.SetStateAction<CircuitSegment[]>>;
  circuitName: string;
  setCircuitName: React.Dispatch<React.SetStateAction<string>>;
  onTrain: () => void;
}) {
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(() =>
    circuitTemplates.some((template) => template.name === circuitName) ? circuitName : null
  );
  const totalMinutes = segments.reduce((total, segment) => total + segment.minutes, 0);

  function updateSegment(id: number, field: keyof CircuitSegment, value: string | number) {
    setSelectedTemplateName(null);
    setSegments((current) => current.map((segment) => segment.id === id ? { ...segment, [field]: value } : segment));
  }

  function addSegment() {
    setSelectedTemplateName(null);
    setSegments((current) => [...current, {
      id: Date.now(), name: "Nuevo tramo", minutes: 3, startPercent: 70, endPercent: 70,
    }]);
  }

  function loadTemplate(template: CircuitTemplate) {
    setSegments(template.segments.map((segment, index) => ({ ...segment, id: Date.now() + index })));
    setCircuitName(template.name);
    setSelectedTemplateName(template.name);
  }

  function startCustomCircuit() {
    setSegments([]);
    setCircuitName("Mi circuito");
    setSelectedTemplateName(null);
  }

  return (
    <section className="editor-card">
      <div className="template-section">
        <div className="template-title">
          <div><span className="label">PLANTILLAS DE 60 MIN</span><h2>Elige una sesión</h2></div>
          <p>Después puedes modificar cualquier tramo.</p>
        </div>
        <div className={`template-selection ${selectedTemplateName ? "selected" : ""}`} role="status" aria-live="polite">
          {selectedTemplateName ? <>✓ <strong>{selectedTemplateName}</strong> está seleccionada y lista para entrenar.</> : "Selecciona una plantilla para cargar su circuito."}
        </div>
        <div className="template-grid">
          {circuitTemplates.map((template) => (
            <article className={`template-card ${selectedTemplateName === template.name ? "selected" : ""}`} key={template.name}>
              <span className={`difficulty ${template.difficulty.toLowerCase()}`}>{template.difficulty}</span>
              <h3>{template.name}</h3>
              <p>{template.focus}</p>
              <div className="template-profile" role="img" aria-label={`Perfil cardiaco por zonas de ${template.name}: azul zona 1, verde zona 2, amarillo zona 3, naranja zona 4 y rojo zona 5`}>
                {template.segments.map((segment, index) => (
                  <i key={`${segment.name}-${index}`} style={{
                    flexGrow: segment.minutes,
                    clipPath: `polygon(0 ${100 - Math.max(0, segment.startPercent - 50) * 2}%, 100% ${100 - Math.max(0, segment.endPercent - 50) * 2}%, 100% 100%, 0 100%)`,
                  }} />
                ))}
              </div>
              <div className="template-zone-key" aria-hidden="true">
                {zones.slice().reverse().map((zone) => <span key={zone.name} style={{ color: zone.color }}>{zone.name.replace("Zona ", "Z")}</span>)}
              </div>
              <small>60 minutos · {template.segments.length} tramos</small>
              <button type="button" aria-pressed={selectedTemplateName === template.name} onClick={() => loadTemplate(template)}>
                {selectedTemplateName === template.name ? "✓ Plantilla seleccionada" : "Usar plantilla"}
              </button>
            </article>
          ))}
          <article className="template-card new-template">
            <span className="difficulty nueva">Nueva</span>
            <h3>Diseñar desde cero</h3>
            <p>Crea tu propia sesión tramo por tramo.</p>
            <small>Duración libre</small>
            <button type="button" onClick={startCustomCircuit}>Crear circuito</button>
          </article>
        </div>
      </div>
      <div className="editor-header">
        <div className="circuit-name"><span className="label">DISEÑADOR</span><input value={circuitName} onChange={(event) => { setCircuitName(event.target.value); setSelectedTemplateName(null); }} aria-label="Nombre del circuito" /></div>
        <div className="editor-actions">
          <div className="duration"><small>DURACIÓN TOTAL</small><strong>{totalMinutes} min</strong></div>
          <button type="button" onClick={onTrain} disabled={!segments.length}>Usar para entrenar →</button>
        </div>
      </div>

      <div className="profile-preview" aria-label="Vista previa del circuito">
        {[100, 90, 80, 70, 60, 50].map((mark) => <span key={mark} style={{ bottom: `${mark - 45}%` }}>{mark}%</span>)}
        <div className="profile-bars">
          {segments.map((segment) => (
            <div className="profile-segment" key={segment.id} style={{ flexGrow: segment.minutes }}>
              <i style={{ height: `${Math.max(segment.endPercent - 45, 5)}%` }} />
              <small>{segment.minutes}m</small>
            </div>
          ))}
        </div>
      </div>

      <div className="segment-list">
        {segments.map((segment, index) => (
          <div className="segment-row" key={segment.id}>
            <b>{index + 1}</b>
            <label className="segment-name"><span>Nombre</span><input value={segment.name} onChange={(event) => updateSegment(segment.id, "name", event.target.value)} /></label>
            <label><span>Minutos</span><input type="number" min="1" max="60" value={segment.minutes} onChange={(event) => updateSegment(segment.id, "minutes", Number(event.target.value))} /></label>
            <label><span>% inicial</span><input type="number" min="40" max="100" value={segment.startPercent} onChange={(event) => updateSegment(segment.id, "startPercent", Number(event.target.value))} /></label>
            <label><span>% final</span><input type="number" min="40" max="100" value={segment.endPercent} onChange={(event) => updateSegment(segment.id, "endPercent", Number(event.target.value))} /></label>
            <button className="delete-button" type="button" aria-label={`Eliminar ${segment.name}`} onClick={() => { setSelectedTemplateName(null); setSegments((current) => current.filter((item) => item.id !== segment.id)); }}>×</button>
          </div>
        ))}
      </div>
      <button className="add-button" type="button" onClick={addSegment}>+ Añadir tramo</button>
    </section>
  );
}

function HistoryView({ history, formatTime }: { history: WorkoutHistory[]; formatTime: (seconds: number) => string }) {
  return (
    <section className="history-card">
      <div className="history-header"><span className="label">HISTORIAL LOCAL</span><h2>Mis entrenamientos</h2><p>Guardados en este dispositivo y disponibles sin conexión.</p></div>
      {history.length === 0 ? <div className="history-empty">Aún no hay sesiones. Inicia un entrenamiento para crear la primera.</div> : (
        <div className="history-list">
          {history.map((item) => (
            <article key={item.id}>
              <div><small>{new Date(item.date).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}</small><strong>{item.circuit}</strong></div>
              <span>{formatTime(item.durationSeconds)}<small>tiempo</small></span>
              <span>{item.averageHeartRate}<small>ppm media</small></span>
              <span>{item.maximumHeartRate}<small>ppm máxima</small></span>
              <b className={item.completed ? "completed" : "stopped"}>{item.completed ? "Completado" : "Detenido"}</b>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
