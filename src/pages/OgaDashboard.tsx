import React, { useEffect, useState } from 'react';
import { SolicitudCard } from '../components/SolicitudCard';
import { OgaAltaForm } from './OgaAltaForm';
import { PersonalDirectory } from '../components/PersonalDirectory';
import { api } from '../api/api';
import type { SolicitudConSistemas, Usuario, Sistema } from '../types/models';
import { toast } from 'sonner';

export const OgaDashboard: React.FC = () => {
    const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT' | 'DIRECTORY'>('LIST');
    const [misSolicitudes, setMisSolicitudes] = useState<SolicitudConSistemas[]>([]);
    const [loading, setLoading] = useState(false);
    const [solicitudToEdit, setSolicitudToEdit] = useState<SolicitudConSistemas | undefined>(undefined);
    const [userForAlta, setUserForAlta] = useState<Usuario | undefined>(undefined);

    // Baja Modal State
    const [showBajaModal, setShowBajaModal] = useState(false);
    const [userToBaja, setUserToBaja] = useState<Usuario | null>(null);
    const [userSystems, setUserSystems] = useState<Sistema[]>([]);

    /**
     * Carga las solicitudes del usuario actual desde la API.
     * Señalización para API Real: Reemplazar api.getMisSolicitudes con un endpoint real.
     */
    const loadSolicitudes = async () => {
        setLoading(true);
        try {
            const user = await api.getCurrentUser();
            const data = await api.getMisSolicitudes(user.id);
            // Ordenar por fecha desc
            setMisSolicitudes(data.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()));
        } catch (error) {
            console.error('Error cargando solicitudes:', error);
            toast.error('Error cargando solicitudes del servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'LIST') {
            loadSolicitudes();
        }
    }, [view]);

    /**
     * Maneja el inicio de la edición de una solicitud.
     * Solo permite editar si el estado es pendiente o ha sido observado.
     */
    const handleEdit = (solicitud: SolicitudConSistemas) => {
        // Solo permitir editar si está pendiente u observada
        if (solicitud.estado === 'PENDIENTE_ALTA' || solicitud.estado === 'PENDIENTE_BAJA' || solicitud.estado === 'OBSERVADO') {
            if (solicitud.estado === 'OBSERVADO' && solicitud.motivo) {
                toast.info(`Atención, solicitud observada por: ${solicitud.motivo}`, {
                    duration: 5000,
                });
            }
            setSolicitudToEdit(solicitud);
            setView('EDIT');
        } else {
            toast.error('Solo se pueden editar solicitudes pendientes u observadas.');
        }
    };

    const handleSuccess = () => {
        setView('LIST');
        setSolicitudToEdit(undefined);
        setUserForAlta(undefined);
    };

    /**
     * Inicia el proceso de generación de alta para un usuario inactivo.
     */
    const handleGenerarAlta = (user: Usuario) => {
        setUserForAlta(user);
        setSolicitudToEdit(undefined);
        setView('CREATE');
    };

    // Baja Logic
    /**
     * Inicia el proceso de baja para un usuario seleccionado del directorio.
     * Carga los sistemas que el usuario tiene actualmente asignados.
     */
    const handleInitiateBaja = async (user: Usuario) => {
        if (!user.sistemas || user.sistemas.length === 0) {
            toast.info('Este usuario no tiene sistemas asignados para dar de baja.');
            // For testing purposes, we might want to allow it or show a mock list
            // return; 
        }

        setUserToBaja(user);

        // Fetch full system details to show names (mock logic)
        try {
            const allSystems = await api.getSistemasAlta(); // Reusing Alta API as it returns all systems
            // Filter systems the user has
            const systemsDetails = allSystems.filter(s => user.sistemas?.includes(s.id));
            setUserSystems(systemsDetails);
            setShowBajaModal(true);
        } catch (e) {
            console.error(e);
            toast.error('Error cargando sistemas del usuario');
        }
    };

    /**
     * Confirma la creación de una solicitud de baja.
     * Señalización para API Real: Cambiar api.createSolicitudBaja por el endpoint de producción.
     */
    const confirmBaja = async () => {
        if (!userToBaja) return;

        try {
            const sistemasIds = userSystems.map(s => s.id);
            await api.createSolicitudBaja(userToBaja.id, sistemasIds); // Assuming basic logic: remove all currently assigned
            toast.success('Solicitud de Baja creada exitosamente');
            setShowBajaModal(false);
            setUserToBaja(null);
            setView('LIST'); // Go to list to see the new request
        } catch (e) {
            console.error(e);
            toast.error('Error al crear solicitud de baja');
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header del Dashboard */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Portal Gestión Administrativa</h1>
                    <p className="text-gray-500 mt-1">Gestione las altas y bajas de personal</p>
                </div>

                <div className="flex gap-3">
                    {view !== 'DIRECTORY' && (
                        <button
                            onClick={() => setView('DIRECTORY')}
                            className="px-4 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl shadow-sm font-medium transition-all"
                        >
                            Directorio de Personal
                        </button>
                    )}

                    {view === 'DIRECTORY' && (
                        <button
                            onClick={() => setView('LIST')}
                            className="px-4 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl shadow-sm font-medium transition-all"
                        >
                            Ver Solicitudes
                        </button>
                    )}

                    {view === 'LIST' && (
                        <button
                            onClick={() => { setSolicitudToEdit(undefined); setView('CREATE'); }}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 font-semibold transition-all hover:-translate-y-0.5"
                        >
                            + Nueva Solicitud
                        </button>
                    )}
                </div>
            </div>

            {/* Sub-Header / Breadcrumbs for Edit/Create */}
            {(view === 'CREATE' || view === 'EDIT') && (
                <button
                    onClick={() => setView('LIST')}
                    className="mb-6 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                    <span>←</span> Volver al Listado
                </button>
            )}

            {/* Contenido Dinámico */}
            {view === 'LIST' && (
                <div className="animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">Mis Solicitudes Recientes</h2>
                        <button onClick={loadSolicitudes} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            ↻ Actualizar
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        misSolicitudes.length === 0 ? (
                            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-500 text-lg mb-4">No has generado ninguna solicitud aún.</p>
                                <button
                                    onClick={() => setView('CREATE')}
                                    className="text-blue-600 font-semibold hover:underline"
                                >
                                    Crear mi primera solicitud
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {misSolicitudes.map(sol => (
                                    <SolicitudCard
                                        key={sol.id}
                                        solicitud={sol}
                                        actionLabel={
                                            (sol.estado === 'PENDIENTE_ALTA' || sol.estado === 'PENDIENTE_BAJA')
                                                ? 'Editar'
                                                : (sol.estado === 'OBSERVADO' ? 'Corregir' : 'Ver Detalle')
                                        }
                                        onAction={() => handleEdit(sol)}
                                        onClick={() => handleEdit(sol)}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}

            {view === 'DIRECTORY' && (
                <div className="animate-fadeIn">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Directorio de Personal</h2>
                    <PersonalDirectory
                        actionLabel="Dar de Baja"
                        onAction={handleInitiateBaja}
                        onGenerarAlta={handleGenerarAlta}
                    />
                </div>
            )}

            {(view === 'CREATE' || view === 'EDIT') && (
                <div className="animate-slideUp">
                    <OgaAltaForm
                        solicitudEdit={solicitudToEdit}
                        initialUser={userForAlta}
                        onSuccess={handleSuccess}
                        onCancel={() => { setView('LIST'); setUserForAlta(undefined); }}
                    />
                </div>
            )}

            {/* Modal de Confirmación de Baja */}
            {showBajaModal && userToBaja && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scaleIn">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar Solicitud de Baja</h3>
                        <p className="text-gray-600 mb-4">Se creará una solicitud para dar de baja los accesos de <span className="font-semibold">{userToBaja.nombre}</span>.</p>

                        <div className="bg-gray-50 p-4 rounded-xl mb-6">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sistemas a desactivar:</h4>
                            {userSystems.length > 0 ? (
                                <ul className="space-y-2">
                                    {userSystems.map(s => (
                                        <li key={s.id} className="flex items-center gap-2 text-sm text-gray-700">
                                            <span className="text-red-500">×</span> {s.nombre}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No se encontraron sistemas registrados.</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowBajaModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmBaja}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-lg shadow-red-500/30 transition-all"
                            >
                                Crear Solicitud de Baja
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
