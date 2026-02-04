import React, { useState } from 'react';
import { EticPendientesList } from './EticPendientesList';
import { UseiSeguimiento } from './UseiSeguimiento';
import { PersonaDirectorio } from '../directorio/PersonaDirectorio';

/**
 * Dashboard para el módulo USEI (ETIC).
 * Implementa pestañas para separar las solicitudes pendientes del directorio de personal.
 */
export const UseiDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'PENDING' | 'SEGUIMIENTO' | 'DIRECTORIO'>('PENDING');

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
            {/* Header del Dashboard */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Portal <span className="text-blue-600">USEI</span> (ETIC)
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Gestión técnica de accesos y directorio institucional.
                    </p>
                </div>

                {/* Switcher de Pestañas Estilo Premium */}
                <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200 w-fit">
                    <button
                        onClick={() => setActiveTab('PENDING')}
                        className={`px-6 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === 'PENDING'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Bandeja Entrada
                    </button>
                    <button
                        onClick={() => setActiveTab('SEGUIMIENTO')}
                        className={`px-6 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === 'SEGUIMIENTO'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Seguimiento
                    </button>
                    <button
                        onClick={() => setActiveTab('DIRECTORIO')}
                        className={`px-6 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === 'DIRECTORIO'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Directorio Institucional
                    </button>
                </div>
            </div>

            {/* Contenido Dinámico según la Pestaña */}
            <div className="animate-fadeIn">
                {activeTab === 'PENDING' && <EticPendientesList />}
                {activeTab === 'SEGUIMIENTO' && <UseiSeguimiento />}
                {activeTab === 'DIRECTORIO' && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fadeIn">
                        <PersonaDirectorio simplified={true} />
                    </div>
                )}
            </div>
        </div>
    );
};
