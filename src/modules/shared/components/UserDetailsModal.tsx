import React, { useEffect, useState } from 'react';
import type { Usuario, Sistema } from '../types/models';
import { api } from '../api/api';

interface UserDetailsModalProps {
    user: Usuario | null;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Modal para mostrar los detalles de un usuario y sus sistemas asignados
 */
export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, isOpen, onClose }) => {
    const [sistemasData, setSistemasData] = useState<Sistema[]>([]);
    const [loadingSistemas, setLoadingSistemas] = useState(false);

    useEffect(() => {
        const loadSistemas = async () => {
            if (isOpen && user) {
                setLoadingSistemas(true);
                try {
                    const data = await api.getSistemas();
                    setSistemasData(data);
                } catch (error) {
                    console.error('Error al cargar sistemas:', error);
                } finally {
                    setLoadingSistemas(false);
                }
            }
        };

        loadSistemas();
    }, [isOpen, user]);

    if (!isOpen || !user) return null;

    // Ayudante para obtener el nombre del sistema por ID
    const getSistemaNombre = (id: string) => {
        const sistema = sistemasData.find(s => s.id === id);
        return sistema ? sistema.nombre : `Sistema ${id}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{user.nombre}</h2>
                        <p className="text-blue-100 text-sm mt-1">{user.cargo || 'Sin cargo'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Información General */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Código</p>
                            <p className="text-lg font-mono font-bold text-gray-800">{user.id_usuario}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Documento</p>
                            <p className="text-lg font-mono font-bold text-gray-800">{user.documento || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Correo</p>
                            <p className="text-sm font-medium text-gray-800 truncate" title={user.correo}>{user.correo}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Área</p>
                            <p className="text-sm font-medium text-gray-800">{user.areaName}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Estado</p>
                            <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${user.id_estado === 8
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                {user.id_estado === 8 ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sistemas Asignados</p>
                            <p className="text-sm font-medium text-gray-800">{user.sistemas?.length || 0} {user.sistemas?.length === 1 ? 'sistema' : 'sistemas'}</p>
                        </div>
                    </div>

                    {/* Sistemas Asignados */}
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Sistemas Asignados

                        </h3>

                        {loadingSistemas ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-gray-500 text-sm">Cargando nombres de sistemas...</p>
                            </div>
                        ) : !user.sistemas || user.sistemas.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500 text-sm">Este usuario no tiene sistemas asignados</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {user.sistemas.map((sistemaId, index) => (
                                    <div
                                        key={sistemaId}
                                        className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-lg font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">{getSistemaNombre(sistemaId)}</p>
                                        </div>
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-500/30"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
