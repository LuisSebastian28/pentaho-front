import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [transformaciones, setTransformaciones] = useState([]);
  const [transformacionSeleccionada, setTransformacionSeleccionada] =
    useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Cargar las transformaciones al montar el componente
  useEffect(() => {
    const cargarTransformaciones = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/listar-transformaciones"
        );
        const data = await response.json();
        setTransformaciones(data);
        setMensaje(data.length > 0 ? "" : "No se encontraron transformaciones");
      } catch (error) {
        setMensaje(`Error cargando transformaciones: ${error.message}`);
      }
    };

    cargarTransformaciones();
  }, []);

  const ejecutarETL = async () => {
    if (!transformacionSeleccionada) {
      setMensaje("❌ Por favor selecciona una transformación");
      return;
    }

    // Validar fechas
    const fechaInicioValida = fechaInicio ? isValidDate(fechaInicio) : true;
    const fechaFinValida = fechaFin ? isValidDate(fechaFin) : true;

    if (!fechaInicioValida || !fechaFinValida) {
      setMensaje("❌ Formato de fecha inválido (usar YYYY-MM-DD)");
      return;
    }

    setCargando(true);
    setMensaje(`⏳ Ejecutando ${transformacionSeleccionada.nombre}...`);

    try {
      console.log('envio:', fechaInicio, fechaFin)
      const response = await fetch("http://localhost:3001/ejecutar-etl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ktrPath: transformacionSeleccionada.ruta,
          fechaInicio: fechaInicio || null,
          fechaFin: fechaFin || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error desconocido");

      setMensaje(
        data.success
          ? `✅ ${transformacionSeleccionada.nombre} ejecutada correctamente`
          : `⚠️ La ejecución terminó con posibles problemas: ${data.message}`
      );

      console.log("Salida:", data.output);
    } catch (error) {
      setMensaje(`❌ Error: ${error.message}`);
      console.error("Error en la ejecución:", error);
    } finally {
      setCargando(false);
    }
  };

  // Función para validar fechas en el frontend
  const isValidDate = (dateString) => {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regEx)) return false;
    const d = new Date(dateString);
    return !isNaN(d.getTime());
  };

  return (
    <div className="app">
      <h1>Ejecutor de ETL Pentaho</h1>
      <div className="controles">
        <div className="selector">
          <label htmlFor="transformaciones">
            Selecciona una transformación:
          </label>
          <select
            id="transformaciones"
            value={transformacionSeleccionada.ruta || ""}
            onChange={(e) => {
              const selected = transformaciones.find(
                (t) => t.ruta === e.target.value
              );
              setTransformacionSeleccionada(selected || "");
            }}
            disabled={cargando || transformaciones.length === 0}
          >
            <option value="">-- Selecciona --</option>
            {transformaciones.map((t) => (
              <option key={t.ruta} value={t.ruta}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="fechas">
          <div className="fecha-input">
            <label htmlFor="fechaInicio">Fecha inicio (YYYY-MM-DD):</label>
            <input
              type="text"
              id="fechaInicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              placeholder="Ej: 2025-05-01"
              disabled={cargando}
            />
          </div>

          <div className="fecha-input">
            <label htmlFor="fechaFin">Fecha fin (YYYY-MM-DD):</label>
            <input
              type="text"
              id="fechaFin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              placeholder="Ej: 2025-05-31"
              disabled={cargando}
            />
          </div>
        </div>

        <button
          onClick={ejecutarETL}
          disabled={cargando || !transformacionSeleccionada}
          className="boton-ejecutar"
        >
          {cargando ? "Ejecutando..." : "Ejecutar ETL"}
        </button>
      </div>
      {mensaje && (
        <div
          className={`mensaje ${mensaje.includes("❌") ? "error" : "exito"}`}
        >
          {mensaje}
        </div>
      )}
    </div>
  );
}

export default App;
