import React, { useState } from 'react';
import { EticChecklist } from './EticChecklist';

/**
 * Dashboard principal para el equipo técnico ETIC.
 * Accesible vía "/etic". Se enfoca puramente en la ejecución técnica.
 */
export const EticDashboard: React.FC = () => {
    const [filterMode, setFilterMode] = useState<'PENDING' | 'SENT'>('PENDING');

    return (
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        Bandeja de Ejecución <span className="text-blue-600">Técnica</span>
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 font-medium italic">
                        Gestione las configuraciones de sistema.
                    </p>
                </div>

                <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200">
                    <button
                        onClick={() => setFilterMode('PENDING')}
                        className={`px-6 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${filterMode === 'PENDING'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Pendientes
                    </button>
                    <button
                        onClick={() => setFilterMode('SENT')}
                        className={`px-6 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${filterMode === 'SENT'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Enviadas a Validar
                    </button>
                </div>
            </div>

            <div className="animate-fadeIn">
                <EticChecklist filterMode={filterMode} />
            </div>
        </div>
    );
};
