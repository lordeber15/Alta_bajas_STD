import React, { useEffect, useState } from 'react';
import { api } from '../shared/api/api';
import type { SolicitudConSistemas, Sistema } from '../shared/types/models';
import { ProgressBar } from '../shared/components/ProgressBar';
import { toast } from 'sonner';

/**
 * Componente para el personal ETIC.
 * Muestra una lista de solicitudes pendientes de configuración técnica.
 * Permite marcar sistemas individuales como listos y enviar a validación.
 */
export const EticPendientesList: React.FC = () => {
    const [solicitudToView, setSolicitudToView] = useState<SolicitudConSistemas | null>(null);
    const [solicitudes, setSolicitudes] = useState<SolicitudConSistemas[]>([]);
    const [loading, setLoading] = useState(false);
    const [sistemasCache, setSistemasCache] = useState<Record<string, Sistema>>({});

    /**
     * Carga todas las solicitudes pendientes de atención técnica (ETIC).
     * Señalización para API Real: Unificar endpoints o cambiar los actuales por reales.
     */
    const loadSolicitudes = async () => {
        setLoading(true);
        try {
            const altas = await api.getSolicitudesPendientesAlta();
            const bajas = await api.getSolicitudesPendientesBaja();
            const all = [...altas, ...bajas].sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime());
            setSolicitudes(all);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar solicitudes pendientes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            await loadSolicitudes();
            const sistemasData = await api.getSistemasAlta();
            const cache: Record<string, Sistema> = {};
            sistemasData.forEach(s => cache[s.id] = s);
            setSistemasCache(cache);
        };
        init();
    }, []);

    /**
     * Cambia el estado de una solicitud a "En Proceso".
     */
    const handleAtender = async (solicitud: SolicitudConSistemas) => {
        try {
            const nuevoEstado = solicitud.tipo === 'ALTA' ? 'EN_PROCESO_ALTA' : 'EN_PROCESO_BAJA';
            await api.cambiarEstadoSolicitud(solicitud.id, nuevoEstado as any);

            const updated = { ...solicitud, estado: nuevoEstado as any };
            setSolicitudes(prev => prev.map(s => s.id === solicitud.id ? updated : s));
            setSolicitudToView(updated);
            toast.success('Atención iniciada correctamente.');
        } catch (error) {
            console.error('Error updating status');
            toast.error('No se pudo iniciar la atención.');
        }
    };

    /**
     * Marca un sistema individual como completado o revocado.
     */
    const handleMarcarSistemaCompletado = async (sistemaId: string) => {
        if (!solicitudToView) return;
        try {
            const updated = await api.marcarSistemaCompletado(solicitudToView.id, sistemaId);
            setSolicitudToView(updated);
            setSolicitudes(prev => prev.map(s => s.id === updated.id ? updated : s));
            toast.success('Sistema actualizado.');
        } catch (error) {
            console.error('Error updating system');
            toast.error('No se pudo actualizar el sistema.');
        }
    };

    /**
     * Calcula el porcentaje de avance de la solicitud.
     */
    const calcularProgreso = (sol: SolicitudConSistemas) => {
        if (!sol.sistemas || sol.sistemas.length === 0) return 0;
        const completados = sol.sistemas.filter(s => s.estadoAtencion === 'COMPLETADO').length;
        return (completados / sol.sistemas.length) * 100;
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
            {/* Sidebar List */}
            <div className="lg:w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-700">Solicitudes Pendientes</h2>
                    <button
                        onClick={loadSolicitudes}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                    >
                        ↻
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading && <div className="text-center py-4 text-gray-400">Cargando...</div>}
                    {!loading && solicitudes.length === 0 && (
                        <div className="text-center py-8 px-4 text-gray-400 text-sm">
                            No hay solicitudes pendientes de atención.
                        </div>
                    )}
                    {solicitudes.map(sol => (
                        <div
                            key={sol.id}
                            onClick={() => setSolicitudToView(sol)}
                            className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 group relative overflow-hidden ${solicitudToView?.id === sol.id ? (sol.tipo === 'BAJA' ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-blue-50 border-blue-200 shadow-sm') : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'}`}
                        >
                            {sol.tipo === 'BAJA' && <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">BAJA</div>}
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-gray-800">{sol.usuarioObjetivoNombre}</span>
                            </div>
                            <div className="flex gap-2 mb-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sol.estado.includes('PENDIENTE') ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                    {sol.estado.includes('PENDIENTE') ? 'PENDIENTE' : 'EN PROCESO'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">{sol.cargo}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Detail View */}
            <div className="lg:w-2/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                {solicitudToView ? (
                    <div className="h-full flex flex-col">
                        <div className={`p-6 border-b border-gray-100 ${solicitudToView.tipo === 'BAJA' ? 'bg-red-50/30' : 'bg-gray-50/50'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-2xl font-bold text-gray-800">{solicitudToView.usuarioObjetivoNombre}</h2>
                                        {solicitudToView.tipo === 'BAJA' && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">SOLICITUD DE BAJA</span>}
                                    </div>
                                    <p className="text-gray-500">{solicitudToView.cargo} • DNI: {solicitudToView.usuarioObjetivoDniRuc}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-400">Solicitado el</div>
                                    <div className="font-medium text-gray-700">{new Date(solicitudToView.fechaCreacion).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                                    <span>Progreso de Atención</span>
                                    <span>{Math.round(calcularProgreso(solicitudToView))}%</span>
                                </div>
                                <ProgressBar value={calcularProgreso(solicitudToView)} />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-white">
                            {(solicitudToView.estado === 'PENDIENTE_ALTA' || solicitudToView.estado === 'PENDIENTE_BAJA') ? (
                                <div className="mb-8 p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex items-center justify-between animate-pulse">
                                    <div className="flex gap-3 items-center text-yellow-800">
                                        <span className="text-xl">⚠️</span>
                                        <p className="text-sm font-medium">Esta solicitud está pendiente de inicio.</p>
                                    </div>
                                    <button
                                        onClick={() => handleAtender(solicitudToView)}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-lg transition-all transform hover:scale-105"
                                    >
                                        Iniciar Atención
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-4 mb-8">
                                    {Math.round(calcularProgreso(solicitudToView)) === 100 ? (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const nextState = solicitudToView.tipo === 'ALTA' ? 'PARA_VALIDAR_ALTA' : 'PARA_VALIDAR_BAJA';
                                                    await api.cambiarEstadoSolicitud(solicitudToView.id, nextState as any);
                                                    toast.success('Enviado a validación.');
                                                    loadSolicitudes();
                                                    setSolicitudToView(null);
                                                } catch (e) {
                                                    console.error(e);
                                                    toast.error('Error al enviar a validar.');
                                                }
                                            }}
                                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            <span>✓</span> VALIDAR SOLICITUD
                                        </button>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                const motivo = prompt("Ingrese el motivo de la observación:");
                                                if (!motivo) return;
                                                try {
                                                    await api.rechazarSolicitud(solicitudToView.id, motivo);
                                                    toast.info('Solicitud observada y devuelta a OGA');
                                                    loadSolicitudes();
                                                    setSolicitudToView(null);
                                                } catch (e) {
                                                    console.error(e);
                                                    toast.error('Error al observar solicitud.');
                                                }
                                            }}
                                            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-all"
                                        >
                                            OBSERVAR / DEVOLVER
                                        </button>
                                    )}
                                </div>
                            )}

                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                                {solicitudToView.tipo === 'BAJA' ? 'Sistemas a Revocar' : 'Sistemas Solicitados'}
                            </h3>
                            <div className="space-y-3">
                                {solicitudToView.sistemas.map(sis => {
                                    const nombre = sistemasCache[sis.sistemaId]?.nombre || sis.sistemaId;
                                    const isDone = sis.estadoAtencion === 'COMPLETADO';
                                    return (
                                        <div key={sis.id} className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${isDone ? (solicitudToView.tipo === 'BAJA' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100') : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${isDone ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                    {isDone ? '✓' : ''}
                                                </div>
                                                <div>
                                                    <p className={`font-medium ${isDone ? 'text-gray-900' : 'text-gray-800'}`}>{nombre}</p>
                                                    {sis.detalle && <p className="text-sm text-gray-500 mt-1 pl-2 border-l-2 border-gray-200">{sis.detalle}</p>}
                                                </div>
                                            </div>
                                            {!isDone && solicitudToView.estado.includes('EN_PROCESO') && (
                                                <button
                                                    onClick={() => handleMarcarSistemaCompletado(sis.sistemaId)}
                                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors opacity-0 group-hover:opacity-100 text-blue-600 bg-blue-50 hover:bg-blue-100"
                                                >
                                                    Listo
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                        <p className="text-lg font-medium text-gray-500">Seleccione una solicitud para comenzar</p>
                    </div>
                )}
            </div>
        </div>
    );
};
