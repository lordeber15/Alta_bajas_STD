import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import type { SolicitudConSistemas } from '../types/models';
import { ProgressBar } from '../components/ProgressBar';
import { toast } from 'sonner';

/**
 * Componente para la lista de solicitudes pendientes de validación por parte del Jefe.
 * Permite al jefe aprobar o rechazar solicitudes.
 */
export const JefeValidationList: React.FC = () => {
    const [pendientes, setPendientes] = useState<SolicitudConSistemas[]>([]);
    const [loading, setLoading] = useState(false);

    /**
     * Carga las solicitudes que requieren validación por parte del Jefe.
     * Señalización para API Real: Reemplazar por endpoint de producción.
     */
    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api.getSolicitudesParaValidar();
            setPendientes(data);
        } catch (e) {
            console.error(e);
            toast.error('Error al cargar validaciones pendientes.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Hook de efecto para cargar los datos al montar el componente.
     */
    useEffect(() => {
        loadData();
    }, []);

    /**
     * Aprueba definitivamente una solicitud.
     * @param id El ID de la solicitud a aprobar.
     */
    const handleAprobar = async (id: string) => {
        try {
            await api.aprobarSolicitud(id);
            toast.success('Solicitud aprobada y proceso completado.');
            loadData();
        } catch (e) {
            console.error(e);
            toast.error('Error al aprobar la solicitud.');
        }
    };

    /**
     * Rechaza u observa una solicitud, devolviéndola al inicio.
     * @param id El ID de la solicitud a rechazar/observar.
     */
    const handleRechazar = async (id: string) => {
        const motivo = "Observado por Jefatura";
        try {
            await api.rechazarSolicitud(id, motivo);
            toast.info('Solicitud devuelta para corrección.');
            loadData();
        } catch (e) {
            console.error(e);
            toast.error('Error al rechazar la solicitud.');
        }
    };

    /**
     * Calcula el progreso de una solicitud basándose en sus sistemas.
     * @param sol La solicitud para calcular el progreso.
     * @returns El porcentaje de progreso.
     */
    const calcularProgreso = (sol: SolicitudConSistemas): number => {
        if (!sol.sistemas || sol.sistemas.length === 0) {
            return 0;
        }
        const completados = sol.sistemas.filter(s => s.estadoAtencion === 'COMPLETADO').length;
        return (completados / sol.sistemas.length) * 100;
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Solicitudes Pendientes de Validación</h2>

            {loading && <div>Cargando...</div>}

            {!loading && pendientes.length === 0 && (
                <div className="text-gray-500 bg-white p-8 rounded-lg border border-dashed border-gray-300 text-center">
                    No hay solicitudes pendientes de validación.
                </div>
            )}

            <div className="grid gap-4">
                {pendientes.map(sol => (
                    <div key={sol.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-gray-800">{sol.usuarioObjetivoNombre}</h3>
                                {sol.tipo === 'BAJA' && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded">BAJA</span>}
                            </div>
                            <p className="text-sm text-gray-500">{sol.cargo} • Oficina: {sol.oficinaId}</p>
                            <div className={`text-xs font-medium mt-1 ${sol.tipo === 'BAJA' ? 'text-red-500' : 'text-blue-600'}`}>
                                {sol.tipo} • Esperando aprobación final
                            </div>

                            {/* Progreso de la solicitud */}
                            <div className="mt-4 w-64">
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-1">
                                    <span>Progreso</span>
                                    <span>{Math.round(calcularProgreso(sol))}%</span>
                                </div>
                                <ProgressBar value={calcularProgreso(sol)} />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleRechazar(sol.id)}
                                className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                            >
                                Observar
                            </button>
                            <button
                                onClick={() => handleAprobar(sol.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors text-white
                                    ${sol.tipo === 'BAJA' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                                `}
                            >
                                {sol.tipo === 'BAJA' ? 'Aprobar Baja' : 'Aprobar Final'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
