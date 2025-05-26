import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [transformaciones, setTransformaciones] = useState([]);
  const [transformacionSeleccionada, setTransformacionSeleccionada] = useState(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [orden, setOrden] = useState("nombre"); // 'nombre', 'fecha', 'tamaño'

  // Icono SVG para las transformaciones Pentaho
const PentahoIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#1C6DA0"/>
    <path d="M32 12L16 28V44L32 60L48 44V28L32 12Z" fill="#FF7F00"/>
    <path d="M32 20L24 28V36L32 44L40 36V28L32 20Z" fill="#1C6DA0"/>
    <path d="M32 28L28 32V36L32 40L36 36V32L32 28Z" fill="white"/>
  </svg>
);

  // Cargar las transformaciones al montar el componente
  useEffect(() => {
    const cargarTransformaciones = async () => {
      try {
        const response = await fetch("http://localhost:3001/listar-transformaciones");
        const data = await response.json();
        setTransformaciones(data);
        setMensaje(data.length > 0 ? "" : "No se encontraron transformaciones");
      } catch (error) {
        setMensaje(`Error cargando transformaciones: ${error.message}`);
      }
    };

    cargarTransformaciones();
  }, []);

  // Ordenar transformaciones
  const transformacionesOrdenadas = [...transformaciones].sort((a, b) => {
    if (orden === "nombre") {
      return a.nombre.localeCompare(b.nombre);
    } else if (orden === "fecha") {
      return new Date(b.fechaModificacion) - new Date(a.fechaModificacion);
    } else if (orden === "tamaño") {
      return b.tamaño - a.tamaño;
    }
    return 0;
  });

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

        <div className="ordenamiento">
          <label>Ordenar por:</label>
          <select 
            value={orden} 
            onChange={(e) => setOrden(e.target.value)}
            disabled={cargando}
          >
            <option value="nombre">Nombre</option>
            <option value="fecha">Fecha modificación</option>
            <option value="tamaño">Tamaño</option>
          </select>
        </div>
      </div>

      <div className="escritorio">
        {transformacionesOrdenadas.map((t) => (
          <div 
            key={t.ruta} 
            className={`icono ${transformacionSeleccionada?.ruta === t.ruta ? 'seleccionado' : ''}`}
            onClick={() => setTransformacionSeleccionada(t)}
            title={`${t.nombre}\nRuta: ${t.ruta}`}
          >
            <div className="icono-imagen">
              <PentahoIcon />
            </div>
            <div className="icono-nombre">{t.nombre.replace('.ktr', '')}</div>
          </div>
        ))}
      </div>

      <div className="acciones">
        <button
          onClick={ejecutarETL}
          disabled={cargando || !transformacionSeleccionada}
          className="boton-ejecutar"
        >
          {cargando ? "Ejecutando..." : "Ejecutar ETL"}
        </button>
      </div>

      {mensaje && (
        <div className={`mensaje ${mensaje.includes("❌") ? "error" : mensaje.includes("⏳") ? "cargando" : "exito"}`}>
          {mensaje}
        </div>
      )}
    </div>
  );
}

export default App;