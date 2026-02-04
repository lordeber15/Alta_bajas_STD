import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import { OgaDashboard } from './modules/oga/OgaDashboard';
import { UseiDashboard } from './modules/usei/UseiDashboard';
import { JefeDashboard } from './modules/jefatura/JefeDashboard';
import { EticDashboard } from './modules/etic/EticDashboard';
import { DirectorioPage } from './modules/directorio/DirectorioPage';

/**
 * Componente principal de la aplicación.
 * Se ha configurado con React Router para manejar diferentes rutas según el rol (OGA, ETIC, Jefatura).
 */
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Toaster position="top-right" richColors closeButton />

        {/* Global Navigation Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30">A</div>
                  <span className="text-xl font-black text-gray-900 tracking-tight">STD <span className="text-blue-600">Portal</span></span>
                </div>

                <nav className="hidden md:flex items-center gap-1">
                  {[
                    { label: 'OGA', path: '/oga' },
                    { label: 'USEI', path: '/usei' },
                    { label: 'ETIC', path: '/etic' },
                    { label: 'Jefatura', path: '/jefatura' },
                    { label: 'Directorio', path: '/directorio', highlight: true }
                  ].map(link => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-bold transition-all
                        ${link.highlight
                          ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
                      `}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-black text-gray-900">User Session</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Demo User</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          <Routes>
            <Route path="/oga" element={<OgaDashboard />} />
            <Route path="/usei" element={<UseiDashboard />} />
            <Route path="/etic" element={<EticDashboard />} />
            <Route path="/directorio" element={<DirectorioPage />} />
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

