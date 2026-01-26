import { useState } from 'react';
import { OgaDashboard } from './pages/OgaDashboard';
import { EticPendientesList } from './pages/EticPendientesList';
import { JefeDashboard } from './pages/JefeDashboard';

function App() {
  const [role, setRole] = useState<'OGA' | 'ETIC' | 'JEFE'>('OGA');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navbar Superior */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                AB
              </div>
              <span className="font-bold text-xl text-gray-800 tracking-tight">Altas y Bajas</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Toggle de Roles (Solo demo) */}
              <div className="bg-gray-100 p-1 rounded-xl flex items-center">
                <button
                  onClick={() => setRole('OGA')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${role === 'OGA'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Usuario OGA
                </button>
                <button
                  onClick={() => setRole('ETIC')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${role === 'ETIC'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Personal ETIC
                </button>
                <button
                  onClick={() => setRole('JEFE')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${role === 'JEFE'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Jefatura
                </button>
              </div>

              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                MOCK MODE ON
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {role === 'OGA' && <OgaDashboard />}
          {role === 'ETIC' && (
            <div className="animate-fadeIn">
              <EticPendientesList />
            </div>
          )}
          {role === 'JEFE' && <JefeDashboard />}
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Sistema de Gestión de Altas y Bajas. Versión Demo.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
