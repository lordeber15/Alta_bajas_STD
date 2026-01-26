import React, { useState } from 'react';
import { JefeValidationList } from './JefeValidationList';
import { PersonalList } from './PersonalList';
import { JefeResumen } from './JefeResumen';

export const JefeDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'RESUMEN' | 'VALIDACION' | 'PERSONAL'>('RESUMEN');

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 animate-fadeIn">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Jefatura</h1>
            <p className="text-gray-500 mb-8">Validación final de accesos y control estratégico de personal</p>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('RESUMEN')}
                    className={`pb-4 px-6 font-bold text-sm transition-colors relative whitespace-nowrap ${activeTab === 'RESUMEN'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Resumen General
                </button>
                <button
                    onClick={() => setActiveTab('VALIDACION')}
                    className={`pb-4 px-6 font-bold text-sm transition-colors relative whitespace-nowrap ${activeTab === 'VALIDACION'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Validaciones Pendientes
                </button>
                <button
                    onClick={() => setActiveTab('PERSONAL')}
                    className={`pb-4 px-6 font-bold text-sm transition-colors relative whitespace-nowrap ${activeTab === 'PERSONAL'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Directorio de Personal
                </button>
            </div>

            {/* Content */}
            <div className="animate-slideUp">
                {activeTab === 'RESUMEN' && <JefeResumen />}
                {activeTab === 'VALIDACION' && <JefeValidationList />}
                {activeTab === 'PERSONAL' && <PersonalList />}
            </div>
        </div>
    );
};
