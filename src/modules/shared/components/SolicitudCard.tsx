import React from 'react';
import type { SolicitudConSistemas } from '../types/models';

interface SolicitudCardProps {
    solicitud: SolicitudConSistemas;
    onClick?: () => void;
    actionLabel?: string;
    onAction?: (e: React.MouseEvent) => void;
    showStatusBadge?: boolean;
}

export const SolicitudCard: React.FC<SolicitudCardProps> = ({
    solicitud,
    onClick,
    actionLabel,
    onAction,
    showStatusBadge = true
}) => {

    const getStatusColor = (estado: string) => {
        if (estado === 'PENDIENTE_ALTA') return 'bg-blue-100 text-blue-800 border-blue-200';
        if (estado === 'PENDIENTE_BAJA') return 'bg-red-100 text-red-800 border-red-200';
        if (estado.includes('EN_PROCESO')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (estado.includes('COMPLETADO')) return 'bg-green-100 text-green-800 border-green-200';
        if (estado.includes('OBSERVADO')) return 'bg-orange-100 text-orange-800 border-orange-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div
            onClick={onClick}
            className={`
        bg-white rounded-xl shadow-sm border border-gray-100 p-5 
        hover:shadow-md transition-all duration-200 cursor-pointer
        flex flex-col gap-3 relative overflow-hidden group
      `}
        >
            {/* Decorative side bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(solicitud.estado).replace('text', 'bg').split(' ')[0]}`} />

            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
                        {solicitud.usuarioObjetivoNombre}
                    </h3>
                    <p className="text-gray-500 text-sm font-medium">{solicitud.cargo}</p>
                    {solicitud.estado === 'OBSERVADO' && solicitud.motivo && (
                        <p className="text-xs text-red-500 font-bold mt-1 line-clamp-1 italic">
                            Obs: {solicitud.motivo}
                        </p>
                    )}
                </div>
                {showStatusBadge && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(solicitud.estado)}`}>
                        {solicitud.estado.replace(/_/g, ' ')}
                    </span>
                )}
            </div>

            <div className="flex justify-end mt-2">
                {actionLabel && onAction && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction(e);
                        }}
                        className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    );
};
