import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { OgaDashboard } from './pages/OgaDashboard';
import { EticPendientesList } from './pages/EticPendientesList';
import { JefeDashboard } from './pages/JefeDashboard';

/**
 * Componente principal de la aplicación.
 * Se ha configurado con React Router para manejar diferentes rutas según el rol (OGA, ETIC, Jefatura).
 * Se eliminó el Navbar y Footer para facilitar la integración en iframes de aplicaciones externas.
 */
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {/* Configuración de Toasts globales */}
        <Toaster position="top-right" richColors closeButton />

        {/* Contenido Principal con Ruteo */}
        <main className="flex-grow">
          <Routes>
            {/* Ruta para el Portal de Gestión Administrativa (OGA) */}
            <Route path="/oga" element={<OgaDashboard />} />

            {/* Ruta para el Personal Técnico (ETIC) */}
            <Route path="/etic" element={
              <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="animate-fadeIn">
                  <EticPendientesList />
                </div>
              </div>
            } />

            {/* Ruta para Jefatura / Validadores */}
            <Route path="/jefatura" element={
              <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <JefeDashboard />
              </div>
            } />

            {/* Redirección por defecto a OGA si la ruta no existe */}
            <Route path="*" element={<Navigate to="/oga" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

