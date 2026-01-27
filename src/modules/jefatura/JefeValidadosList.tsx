import React, { useEffect, useState } from 'react';
import { api } from '../shared/api/api';
import type { SolicitudConSistemas } from '../shared/types/models';
import { ProgressBar } from '../shared/components/ProgressBar';
import { toast } from 'sonner';

/**
 * Componente para visualizar el historial de solicitudes ya validadas por Jefatura.
 * Solo lectura, informativo.
 */
export const JefeValidadosList: React.FC = () => {
    const [validados, setValidados] = useState<SolicitudConSistemas[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api.getSolicitudesValidadas();
            setValidados(data);
        } catch (e) {
            console.error(e);
            toast.error('Error al cargar historial de validados.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const calcularProgreso = (sol: SolicitudConSistemas): number => {
        if (!sol.sistemas || sol.sistemas.length === 0) return 100; // Si no hay sistemas en una aprobada, asumimos 100
        const completados = sol.sistemas.filter((s: any) => s.estadoAtencion === 'COMPLETADO').length;
        return (completados / sol.sistemas.length) * 100;
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Historial de Solicitudes Validadas</h2>

            {loading && <div className="text-center py-10 text-gray-400">Cargando historial...</div>}

            {!loading && validados.length === 0 && (
                <div className="text-gray-500 bg-white p-8 rounded-lg border border-dashed border-gray-300 text-center">
                    Aún no hay solicitudes validadas en el historial.
                </div>
            )}

            <div className="grid gap-4">
                {validados.map(sol => (
                    <div key={sol.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center opacity-90 grayscale-[0.2]">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-gray-700">{sol.usuarioObjetivoNombre}</h3>
                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    VALIDADO
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">{sol.cargo} • Oficina: {sol.oficinaId}</p>

                            <div className="mt-4 w-64">
                                <ProgressBar value={calcularProgreso(sol)} />
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Tipo de Trámite</span>
                            <span className={`px-3 py-1 rounded-lg text-xs font-black border ${sol.tipo === 'ALTA' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                {sol.tipo}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
