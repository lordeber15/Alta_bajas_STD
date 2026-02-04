import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonaDirectorio } from './PersonaDirectorio';
import { toast } from 'sonner';

export const DirectorioPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        Directorio <span className="text-blue-600">Institucional</span>
                    </h1>
                    <p className="text-gray-500 mt-1">Consulte y gestione la información del personal y sus accesos.</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                        ← Volver
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-all flex items-center gap-2"
                    >
                        🔄 Actualizar
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
                <div className="p-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="p-6">
                    <PersonaDirectorio
                        showExport={true}
                        onAction={(user) => {
                            toast.info(`Redirigiendo para baja de: ${user.nombre}`);
                            navigate('/oga', { state: { initialUser: user, mode: 'BAJA' } });
                        }}
                        onModificar={(user) => {
                            toast.info(`Redirigiendo para modificar: ${user.nombre}`);
                            navigate('/oga', { state: { initialUser: user, mode: 'MODIFICACION' } });
                        }}
                        onGenerarAlta={(user) => {
                            toast.info(`Redirigiendo para alta de: ${user.nombre}`);
                            navigate('/oga', { state: { initialUser: user, mode: 'ALTA' } });
                        }}
                    />
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                    <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <span>📝</span> Altas
                    </h3>
                    <p className="text-sm text-blue-700">Para usuarios inactivos, use "Generar Alta" para iniciar el proceso de incorporación.</p>
                </div>
                <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                    <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                        <span>🚫</span> Bajas
                    </h3>
                    <p className="text-sm text-red-700">Utilice "Dar de Baja" para retirar accesos de personal que cesa funciones.</p>
                </div>
                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                    <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <span>⚙️</span> Modificaciones
                    </h3>
                    <p className="text-sm text-indigo-700">Cambie los sistemas asignados a un usuario activo mediante "Modificar".</p>
                </div>
            </div>
        </div>
    );
};
