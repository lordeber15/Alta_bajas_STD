import React from 'react';
import type { SolicitudConSistemas } from '../shared/types/models';
import { ProgressBar } from '../shared/components/ProgressBar';

interface SolicitudReadDetailProps {
    solicitud: SolicitudConSistemas;
    onBack: () => void;
}

/**
 * Vista de solo lectura para solicitudes.
 * Se usa cuando OGA intenta ver una solicitud que ya no es editable.
 */
export const SolicitudReadDetail: React.FC<SolicitudReadDetailProps> = ({ solicitud, onBack }) => {
    const calcularProgreso = () => {
        if (!solicitud.sistemas || solicitud.sistemas.length === 0) return 0;
        const completados = solicitud.sistemas.filter(s => s.estadoAtencion === 'COMPLETADO').length;
        return (completados / solicitud.sistemas.length) * 100;
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-4xl mx-auto animate-fadeIn">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">Detalle de Solicitud</h2>
                    <p className="text-sm text-gray-500 font-medium">ID: {solicitud.id} • {solicitud.tipo}</p>
                </div>
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                >
                    ← Volver al Listado
                </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Info Personal */}
                <div className="space-y-6">
                    <section>
                        <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Información del Usuario</h3>
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2">
                            <p className="text-lg font-bold text-gray-800">{solicitud.usuarioObjetivoNombre}</p>
                            <p className="text-sm text-gray-600"><span className="font-bold">DNI/RUC:</span> {solicitud.usuarioObjetivoDniRuc}</p>
                            <p className="text-sm text-gray-600"><span className="font-bold">Cargo:</span> {solicitud.cargo}</p>
                            <p className="text-sm text-gray-600"><span className="font-bold">Área:</span> {solicitud.oficinaNombre || 'Cargando...'}</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-3">Estado del Trámite</h3>
                        <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-bold text-orange-700">{solicitud.estado.replace('_', ' ')}</span>
                                <span className="text-sm font-bold text-orange-700">{Math.round(calcularProgreso())}%</span>
                            </div>
                            <ProgressBar value={calcularProgreso()} />
                            {solicitud.motivo && (
                                <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                                    <h4 className="text-xs font-bold text-red-700 uppercase mb-1">Motivo de Observación:</h4>
                                    <p className="text-sm text-red-900">{solicitud.motivo}</p>
                                </div>
                            )}
                            <p className="mt-4 text-[11px] text-gray-500 italic leading-relaxed text-center">
                                Esta solicitud se encuentra en proceso técnico o de validación.
                                No es posible realizar modificaciones en este estado.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Sistemas */}
                <div>
                    <h3 className="text-xs font-black text-green-600 uppercase tracking-widest mb-3">Sistemas Solicitados</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {solicitud.sistemas.map(sis => (
                            <div key={sis.id} className="p-4 rounded-xl border border-gray-100 bg-white flex justify-between items-start group hover:border-blue-200 transition-all shadow-sm">
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-800">{sis.sistemaNombre || sis.sistemaId}</p>
                                    {sis.detalle && <p className="text-xs text-gray-500 mt-1 leading-relaxed bg-gray-50 p-2 rounded-lg">{sis.detalle}</p>}
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${sis.estadoAtencion === 'COMPLETADO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {sis.estadoAtencion}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
