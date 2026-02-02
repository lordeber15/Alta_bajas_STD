import React, { useEffect, useState } from 'react';
import { api } from '../shared/api/api';
import type { SolicitudConSistemas } from '../shared/types/models';
import { ProgressBar } from '../shared/components/ProgressBar';

/**
 * Componente de Seguimiento para USEI.
 * Muestra el estado de todas las solicitudes que no están completadas.
 */
export const UseiSeguimiento: React.FC = () => {
    const [solicitudes, setSolicitudes] = useState<SolicitudConSistemas[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            // Let's check api.ts again for a suitable method.
            const altas = await api.getSolicitudesPendientesAlta();
            const bajas = await api.getSolicitudesPendientesBaja();
            const paraValidar = await api.getSolicitudesParaValidar();

            const combined = [...altas, ...bajas, ...paraValidar];
            // Remove duplicates by ID and sort
            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());

            setSolicitudes(unique.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const calcularProgreso = (sol: SolicitudConSistemas) => {
        if (!sol.sistemas || sol.sistemas.length === 0) return 0;
        const completados = sol.sistemas.filter(s => s.estadoAtencion === 'COMPLETADO').length;
        return (completados / sol.sistemas.length) * 100;
    };

    const getStatusColor = (estado: string) => {
        if (estado.includes('EN_PROCESO')) return 'text-blue-600 bg-blue-50 border-blue-100';
        if (estado.includes('PARA_VALIDAR')) return 'text-purple-600 bg-purple-50 border-purple-100';
        if (estado === 'OBSERVADO') return 'text-orange-600 bg-orange-50 border-orange-100';
        return 'text-gray-600 bg-gray-50 border-gray-100';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Seguimiento de Solicitudes en Curso</h2>
                <button onClick={loadData} className="text-sm text-blue-600 font-bold hover:underline">Actualizar Lista</button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400 font-medium">Cargando seguimiento...</div>
            ) : solicitudes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-400 italic">
                    No hay solicitudes en curso actualmente.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {solicitudes.map(sol => (
                        <div key={sol.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{sol.tipo}</span>
                                    <h3 className="font-bold text-gray-800 leading-tight">{sol.usuarioObjetivoNombre}</h3>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getStatusColor(sol.estado)}`}>
                                    {sol.estado.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                                    <span>Progreso Técnico</span>
                                    <span>{Math.round(calcularProgreso(sol))}%</span>
                                </div>
                                <ProgressBar value={calcularProgreso(sol)} />
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                <span className="text-[10px] text-gray-400 italic">Creado: {new Date(sol.fechaCreacion).toLocaleDateString()}</span>
                                <div className="flex -space-x-2">
                                    {sol.sistemas.slice(0, 3).map((s, idx) => (
                                        <div key={idx} title={s.sistemaNombre || s.sistemaId} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold ${s.estadoAtencion === 'COMPLETADO' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                            {(s.sistemaNombre || s.sistemaId).substring(0, 1)}
                                        </div>
                                    ))}
                                    {sol.sistemas.length > 3 && (
                                        <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 text-gray-500 flex items-center justify-center text-[8px] font-black">
                                            +{sol.sistemas.length - 3}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
