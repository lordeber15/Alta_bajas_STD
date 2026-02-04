import React, { useEffect, useState } from 'react';
import { api } from '../shared/api/api';
import type { SolicitudConSistemas, Sistema } from '../shared/types/models';
import { ProgressBar } from '../shared/components/ProgressBar';
import { ObservationModal } from '../shared/components/ObservationModal';
import { toast } from 'sonner';

/**
 * Componente para el personal técnico ETIC.
 * Muestra solicitudes ya iniciadas (EN_PROCESO) para completar el checklist de sistemas.
 */
interface EticChecklistProps {
    filterMode?: 'PENDING' | 'SENT';
}

export const EticChecklist: React.FC<EticChecklistProps> = ({ filterMode = 'PENDING' }) => {
    const [solicitudToView, setSolicitudToView] = useState<SolicitudConSistemas | null>(null);
    const [solicitudes, setSolicitudes] = useState<SolicitudConSistemas[]>([]);
    const [loading, setLoading] = useState(false);
    const [sistemasCache, setSistemasCache] = useState<Record<string, Sistema>>({});
    const [showObsModal, setShowObsModal] = useState(false);

    const loadSolicitudes = async () => {
        setLoading(true);
        try {
            // Cargamos de alta y baja
            const altas = await api.getSolicitudesPendientesAlta();
            const bajas = await api.getSolicitudesPendientesBaja();
            const modificaciones = await api.getSolicitudesPendientesModificacion();
            const validadas = await api.getSolicitudesValidadas(); // For historical
            const paraValidar = await api.getSolicitudesParaValidar(); // Status 3

            let filtered: SolicitudConSistemas[] = [];

            if (filterMode === 'PENDING') {
                // Filtramos las que están EN_PROCESO (2) o en fase TECNICO (3)
                filtered = [...altas, ...bajas, ...modificaciones].filter(s => s.estado.includes('EN_PROCESO') || s.estado.includes('TECNICO'));
            } else {
                // Enviadas a validar (3) o Validadas/Completadas (4)
                filtered = [...paraValidar, ...validadas];
            }

            setSolicitudes(filtered.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()));
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar solicitudes.');
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
    }, [filterMode]);

    const handleToggleSistema = async (sistemaId: string, currentStatus: string) => {
        if (!solicitudToView) return;
        try {
            const nextStatus = currentStatus === 'COMPLETADO' ? 'PENDIENTE' : 'COMPLETADO';
            const updated = await api.marcarSistemaCompletado(solicitudToView.id, sistemaId, nextStatus);
            setSolicitudToView(updated);
            setSolicitudes(prev => prev.map(s => s.id === updated.id ? updated : s));
            toast.success(`Sistema marcado como ${nextStatus.toLowerCase()}.`);
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar sistema.');
        }
    };

    const calcularProgreso = (sol: SolicitudConSistemas) => {
        if (!sol.sistemas || sol.sistemas.length === 0) return 0;
        const completados = sol.sistemas.filter(s => s.estadoAtencion === 'COMPLETADO').length;
        return (completados / sol.sistemas.length) * 100;
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
            {/* Sidebar List (Solo EN_PROCESO) */}
            <div className="lg:w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-700">Checklist en Ejecución</h2>
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">ETIC</span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading && <div className="text-center py-4 text-gray-400">Cargando...</div>}
                    {!loading && solicitudes.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm italic">
                            No hay procesos técnicos activos.
                        </div>
                    )}
                    {solicitudes.map(sol => (
                        <div
                            key={sol.id}
                            onClick={() => setSolicitudToView(sol)}
                            className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 ${solicitudToView?.id === sol.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-gray-800">{sol.usuarioObjetivoNombre}</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{sol.cargo}</p>
                            <ProgressBar value={calcularProgreso(sol)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Detail */}
            <div className="lg:w-2/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                {solicitudToView ? (
                    <div className="h-full flex flex-col">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-2xl font-bold text-gray-800">{solicitudToView.usuarioObjetivoNombre}</h2>
                            <p className="text-gray-500 mb-4">{solicitudToView.cargo} • DNI: {solicitudToView.usuarioObjetivoDniRuc}</p>

                            <div className="flex gap-4">
                                {filterMode === 'PENDING' ? (
                                    Math.round(calcularProgreso(solicitudToView)) === 100 ? (
                                        <div className="flex flex-col gap-2 w-full">
                                            {solicitudToView.estado.includes('EN_PROCESO') ? (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const nextState = solicitudToView.tipo === 'ALTA' ? 'PARA_VALIDAR_ALTA' : 'PARA_VALIDAR_BAJA';
                                                            await api.cambiarEstadoSolicitud(solicitudToView.id, nextState as any);
                                                            toast.success('Validación técnica completada. Enviado a Jefatura.');
                                                            loadSolicitudes();
                                                            setSolicitudToView(null);
                                                        } catch (e) {
                                                            console.error(e);
                                                            toast.error('Error al enviar a validación.');
                                                        }
                                                    }}
                                                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all"
                                                >
                                                    FINALIZAR Y ENVIAR A JEFATURA
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const nextState = solicitudToView.tipo === 'ALTA' ? 'PARA_VALIDAR_ALTA' : 'PARA_VALIDAR_BAJA';
                                                            await api.cambiarEstadoSolicitud(solicitudToView.id, nextState as any);
                                                            toast.success('Paso técnico completado. Enviado a Coordinación.');
                                                            loadSolicitudes();
                                                            setSolicitudToView(null);
                                                        } catch (e) {
                                                            console.error(e);
                                                            toast.error('Error al finalizar.');
                                                        }
                                                    }}
                                                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all"
                                                >
                                                    FINALIZAR Y ENVIAR A VALIDAR
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowObsModal(true)}
                                            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-all"
                                        >
                                            OBSERVAR / DEVOLVER (INCOMPLETO)
                                        </button>
                                    )
                                ) : (
                                    <div className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl text-center">
                                        VISTA DE SÓLO LECTURA (EN VALIDACIÓN/COMPLETADA)
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Checklist de Sistemas</h3>
                            <div className="space-y-3">
                                {solicitudToView.sistemas.map(sis => {
                                    const nombre = sistemasCache[sis.sistemaId]?.nombre || sis.sistemaId;
                                    const isDone = sis.estadoAtencion === 'COMPLETADO';
                                    return (
                                        <div key={sis.id} className={`flex items-center justify-between p-4 rounded-xl border ${isDone ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
                                            <div>
                                                <p className="font-medium text-gray-800">{nombre}</p>
                                                {sis.detalle && <p className="text-xs text-gray-500 mt-1">{sis.detalle}</p>}
                                            </div>
                                            {filterMode === 'PENDING' && (
                                                <button
                                                    onClick={() => handleToggleSistema(sis.sistemaId, sis.estadoAtencion)}
                                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isDone
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                        }`}
                                                >
                                                    {isDone ? 'Quitar' : 'Listo'}
                                                </button>
                                            )}
                                            {isDone && !filterMode.includes('PENDING') && <span className="text-green-600 font-black">✓</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 italic">Seleccione un proceso activo para trabajar</div>
                )}
            </div>

            <ObservationModal
                isOpen={showObsModal}
                onClose={() => setShowObsModal(false)}
                onConfirm={async (motivo) => {
                    if (!solicitudToView) return;
                    try {
                        await api.rechazarSolicitud(solicitudToView.id, motivo);
                        toast.info('Solicitud devuelta a OGA.');
                        setShowObsModal(false);
                        loadSolicitudes();
                        setSolicitudToView(null);
                    } catch (e) {
                        console.error(e);
                        toast.error('Error al observar.');
                    }
                }}
                title="Observar Solicitud (ETIC)"
            />
        </div>
    );
};
