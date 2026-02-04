import React, { useEffect, useState } from 'react';
import { api } from '../shared/api/api';
import type { SolicitudConSistemas, Sistema } from '../shared/types/models';
import { ObservationModal } from '../shared/components/ObservationModal';
import { toast } from 'sonner';

/**
 * Componente para el personal USEI (Coordinación ETIC).
 * Funciona como Bandeja de Entrada para solicitudes nuevas (PENDIENTE).
 * Una vez iniciada la atención, la solicitud pasa a la fase técnica en /etic.
 */
export const EticPendientesList: React.FC = () => {
    const [solicitudToView, setSolicitudToView] = useState<SolicitudConSistemas | null>(null);
    const [solicitudes, setSolicitudes] = useState<SolicitudConSistemas[]>([]);
    const [loading, setLoading] = useState(false);
    const [sistemasCache, setSistemasCache] = useState<Record<string, Sistema>>({});
    const [showObservationModal, setShowObservationModal] = useState(false);

    const loadSolicitudes = async () => {
        setLoading(true);
        try {
            const altas = await api.getSolicitudesPendientesAlta();
            const bajas = await api.getSolicitudesPendientesBaja();
            const modificaciones = await api.getSolicitudesPendientesModificacion();
            const pendientes = [...altas, ...bajas, ...modificaciones].filter(s => s.estado.includes('PENDIENTE'));
            setSolicitudes(pendientes.sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()));
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

    const handleAtender = async (solicitud: SolicitudConSistemas) => {
        try {
            const nuevoEstado = solicitud.tipo === 'ALTA' ? 'EN_PROCESO_ALTA' : 'EN_PROCESO_BAJA';
            await api.cambiarEstadoSolicitud(solicitud.id, nuevoEstado as any);
            setSolicitudes(prev => prev.filter(s => s.id !== solicitud.id));
            setSolicitudToView(null);
            toast.success('Atención iniciada. La solicitud pasó a la bandeja técnica /ETIC.');
        } catch (error) {
            console.error('Error updating status');
            toast.error('No se pudo iniciar la atención.');
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
            {/* Sidebar List */}
            <div className="lg:w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-700">Solicitudes Pendientes</h2>
                    <button onClick={loadSolicitudes} className="p-2 text-gray-500 hover:text-blue-600 rounded-lg">
                        ↻
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading && <div className="text-center py-4 text-gray-400">Cargando...</div>}
                    {!loading && solicitudes.length === 0 && (
                        <div className="text-center py-8 px-4 text-gray-400 text-sm italic">
                            No hay nuevas solicitudes en cola.
                        </div>
                    )}
                    {solicitudes.map(sol => (
                        <div
                            key={sol.id}
                            onClick={() => setSolicitudToView(sol)}
                            className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 ${solicitudToView?.id === sol.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="font-semibold text-gray-800">{sol.usuarioObjetivoNombre}</div>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${sol.tipo === 'ALTA' ? 'bg-green-100 text-green-700' :
                                        sol.tipo === 'BAJA' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>
                                    {sol.tipo === 'MODIFICACION' ? 'MODIF.' : sol.tipo}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{sol.cargo}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Detail View */}
            <div className="lg:w-2/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                {solicitudToView ? (
                    <div className="h-full flex flex-col">
                        <div className={`p-6 border-b border-gray-100 ${solicitudToView.tipo === 'BAJA' ? 'bg-red-50/30' : 'bg-gray-50/50'}`}>
                            <h2 className="text-2xl font-bold text-gray-800">{solicitudToView.usuarioObjetivoNombre}</h2>
                            <p className="text-gray-500">{solicitudToView.cargo} • DNI: {solicitudToView.usuarioObjetivoDniRuc}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center justify-center text-center gap-4">
                                <div className="p-4 bg-white rounded-full shadow-sm text-3xl">📥</div>
                                <h3 className="text-lg font-bold text-blue-900">Solicitud Nueva</h3>
                                <p className="text-sm text-blue-700 max-w-sm">
                                    Haga clic en el botón para recibir la solicitud e iniciar el trámite técnico.
                                </p>
                                <div className="flex gap-4 w-full max-w-sm">
                                    <button
                                        onClick={() => setShowObservationModal(true)}
                                        className="flex-1 py-3 bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-black rounded-xl transition-all"
                                    >
                                        OBSERVAR
                                    </button>
                                    <button
                                        onClick={() => handleAtender(solicitudToView)}
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg transition-all"
                                    >
                                        INICIAR
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Sistemas Solicitados</h3>
                            <div className="space-y-3">
                                {solicitudToView.sistemas.map(sis => {
                                    const nombre = sistemasCache[sis.sistemaId]?.nombre || sis.sistemaId;
                                    return (
                                        <div key={sis.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                            <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                                            <p className="font-medium text-gray-800 text-sm">{nombre}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 italic">Seleccione una solicitud para comenzar</div>
                )}
            </div>

            <ObservationModal
                isOpen={showObservationModal}
                onClose={() => setShowObservationModal(false)}
                onConfirm={async (motivo) => {
                    if (!solicitudToView) return;
                    try {
                        await api.rechazarSolicitud(solicitudToView.id, motivo);
                        toast.info('Solicitud devuelta a OGA.');
                        setShowObservationModal(false);
                        loadSolicitudes();
                        setSolicitudToView(null);
                    } catch (e) {
                        console.error(e);
                        toast.error('Error al observar.');
                    }
                }}
                title="Observar Solicitud (USEI)"
            />
        </div>
    );
};
