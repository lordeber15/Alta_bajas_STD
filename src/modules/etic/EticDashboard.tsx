import React from 'react';
import { EticChecklist } from './EticChecklist';

/**
 * Dashboard principal para el equipo técnico ETIC.
 * Accesible vía "/etic". Se enfoca puramente en la ejecución técnica.
 */
export const EticDashboard: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        Bandeja de Ejecución <span className="text-blue-600">Técnica</span>
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 font-medium italic">
                        Solo se muestran solicitudes ya iniciadas y en proceso de configuración.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                    <span className="text-xs font-bold text-blue-700 uppercase">Personal Técnico</span>
                </div>
            </div>

            <div className="animate-fadeIn">
                <EticChecklist />
            </div>
        </div>
    );
};
