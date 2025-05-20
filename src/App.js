import React, { useState } from 'react';
import './App.css';

function App() {
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const ejecutarETL = async () => {
    setCargando(true);
    setMensaje('Ejecutando ETL...');

    try {
      const response = await fetch('http://localhost:3001/ejecutar-etl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      setMensaje(data.message || '✅ ETL ejecutado con éxito');
    } catch (error) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="app">
      <h1>Ejecutor de ETL Pentaho</h1>
      <div className="controles">
        <button 
          onClick={ejecutarETL}
          disabled={cargando}
        >
          {cargando ? 'Ejecutando...' : 'Ejecutar ETL'}
        </button>
      </div>
      {mensaje && <div className="mensaje">{mensaje}</div>}
    </div>
  );
}

export default App;