import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { OgaDashboard } from './modules/oga/OgaDashboard';
import { UseiDashboard } from './modules/usei/UseiDashboard';
import { JefeDashboard } from './modules/jefatura/JefeDashboard';
import { EticDashboard } from './modules/etic/EticDashboard';

/**
 * Componente principal de la aplicación.
 * Se ha configurado con React Router para manejar diferentes rutas según el rol (OGA, ETIC, Jefatura).
 */
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Toaster position="top-right" richColors closeButton />

        <main className="flex-grow">
          <Routes>
            <Route path="/oga" element={<OgaDashboard />} />
            <Route path="/usei" element={<UseiDashboard />} />
            <Route path="/etic" element={<EticDashboard />} />
            <Route path="/jefatura" element={
              <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <JefeDashboard />
              </div>
            } />
            <Route path="*" element={<Navigate to="/oga" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

