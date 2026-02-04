import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { OgaAltaForm } from './OgaAltaForm';
import { SolicitudReadDetail } from './SolicitudReadDetail';
import { api } from '../shared/api/api';
import type { SolicitudConSistemas, Usuario } from '../shared/types/models';
import { toast } from 'sonner';
import { PersonaDirectorio } from '../directorio/PersonaDirectorio';

export const OgaDashboard: React.FC = () => {
    const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT' | 'DETAIL'>('LIST');
    const [formMode, setFormMode] = useState<'ALTA' | 'BAJA' | 'MODIFICACION'>('ALTA');
    const [activeTab, setActiveTab] = useState<'SOLICITUDES' | 'DIRECTORIO'>('SOLICITUDES');
    const [misSolicitudes, setMisSolicitudes] = useState<SolicitudConSistemas[]>([]);
    const [loading, setLoading] = useState(false);
    const [solicitudToEdit, setSolicitudToEdit] = useState<SolicitudConSistemas | null>(null);
    const [userForAlta, setUserForAlta] = useState<Usuario | undefined>(undefined);
    const [totalSystemsCount, setTotalSystemsCount] = useState<number>(0);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const location = useLocation();

    useEffect(() => {
        const fetchSystems = async () => {
            try {
                const systems = await api.getSistemas();
                // Solo contamos los que aplican para alta
                const count = systems.filter((s: any) => s.aplicaAlta).length;
                setTotalSystemsCount(count);
            } catch (error) {
                console.error('Error fetching systems count:', error);
            }
        };
        fetchSystems();
    }, []);

    useEffect(() => {
        if (location.state?.initialUser) {
            setUserForAlta(location.state.initialUser);
            setFormMode(location.state.mode || 'ALTA');
            setView('CREATE');
            // Limpiar el estado para que no se repita al recargar
            window.history.replaceState({}, document.title);
        }
    }, [location]);
    /**
     * Carga las solicitudes del usuario actual desde la API.
     */
    const loadSolicitudes = async () => {
        setLoading(true);
        try {
            const user = await api.getCurrentUser();
            const data = await api.getMisSolicitudes(user.id);

            // Regla de Negocio: Filtrar las completadas de hace más de 7 días
            const now = new Date();
            const filteredData = data.filter((sol: SolicitudConSistemas) => {
                if (sol.estado.includes('COMPLETADO')) {
                    const diffTime = Math.abs(now.getTime() - new Date(sol.fechaCreacion).getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 7;
                }
                return true;
            });

            // Ordenar por fecha desc
            setMisSolicitudes(filteredData.sort((a: SolicitudConSistemas, b: SolicitudConSistemas) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()));
            setCurrentPage(1); // Reset a primera página al recargar
        } catch (error) {
            console.error('Error cargando solicitudes:', error);
            toast.error('Error cargando solicitudes del servidor.');
        } finally {
            setLoading(false);
        }
    };

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = misSolicitudes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(misSolicitudes.length / itemsPerPage);

    useEffect(() => {
        if (view === 'LIST') {
            loadSolicitudes();
        }
    }, [view]);

    /**
     * Maneja el inicio de la edición de una solicitud.
     */
    const handleEdit = (sol: SolicitudConSistemas) => {
        setSolicitudToEdit(sol);
        setFormMode(sol.tipo as 'ALTA' | 'BAJA' | 'MODIFICACION');
        if (sol.estado === 'OBSERVADO') {
            if (sol.motivo) {
                toast.info(`Solicitud observada: ${sol.motivo} `, { duration: 5000 });
            }
            setView('EDIT');
        } else {
            setView('DETAIL');
            toast.info('Vista de solo lectura para solicitudes en curso.');
        }
    };

    const handleSuccess = () => {
        setView('LIST');
        setSolicitudToEdit(null);
        setUserForAlta(undefined);
        setFormMode('ALTA'); // Reset form mode
    };

    const handleNewAlta = () => {
        setSolicitudToEdit(null);
        setUserForAlta(undefined);
        setFormMode('ALTA');
        setView('CREATE');
    };

    /**
     * Verifica si un usuario tiene solicitudes pendientes u observadas.
     */
    const hasPendingSolicitud = (usuarioId: number) => {
        return misSolicitudes.some(sol =>
            sol.usuarioObjetivoId === usuarioId &&
            !sol.estado.includes('COMPLETADO') &&
            sol.estado !== 'ANULADO'
        );
    };

    /**
     * Cancela/Anula una solicitud observada.
     */
    const handleAnular = async (id: string | number) => {
        if (!window.confirm('¿Está seguro de que desea anular esta solicitud?')) return;
        try {
            // Asumimos que la API permite cambiar a ANULADO o simplemente borrarla si es observada
            // Según el requerimiento, al anular se permite solicitar nuevamente,
            // así que lo más limpio es eliminarla o cambiarla a un estado final ANULADO.
            await api.cancelSolicitud(id);
            toast.success('Solicitud anulada correctamente');
            loadSolicitudes();
        } catch (error) {
            console.error('Error al anular:', error);
            toast.error('No se pudo anular la solicitud.');
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header del Dashboard */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-100 pb-8">
                <div className="flex flex-col md:flex-row md:items-center gap-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Portal <span className="text-blue-600">OGA</span></h1>
                        <p className="text-gray-500 mt-1 font-medium">Gestión de accesos y personal</p>
                    </div>

                    {/* Tabs Switcher */}
                    <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200 w-fit">
                        <button
                            onClick={() => setActiveTab('SOLICITUDES')}
                            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === 'SOLICITUDES'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Mis Solicitudes
                        </button>
                        <button
                            onClick={() => setActiveTab('DIRECTORIO')}
                            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === 'DIRECTORIO'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Directorio Personal
                        </button>
                    </div>
                </div>

                <div className="flex gap-3">
                    {view === 'DETAIL' && (
                        <button
                            onClick={() => setView('LIST')}
                            className="px-4 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl shadow-sm font-medium transition-all"
                        >
                            Ver Solicitudes
                        </button>
                    )}

                    {(view === 'LIST' || view === 'DETAIL') && (
                        <button
                            onClick={handleNewAlta}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 font-semibold transition-all active:scale-95"
                        >
                            + Nueva Solicitud
                        </button>
                    )}
                </div>
            </div>

            {/* Sub-Header / Breadcrumbs for Edit/Create */}
            {(view === 'CREATE' || view === 'EDIT') && (
                <button
                    onClick={() => { setView('LIST'); setUserForAlta(undefined); setFormMode('ALTA'); }}
                    className="mb-6 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                    <span>←</span> Volver al Listado
                </button>
            )}

            {/* Contenido Dinámico */}
            {view === 'LIST' && (
                <div className="animate-fadeIn">
                    {activeTab === 'SOLICITUDES' ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800">Mis Solicitudes Recientes</h2>
                                <button onClick={loadSolicitudes} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    Actualizar
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                misSolicitudes.length === 0 ? (
                                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                        <p className="text-gray-500 text-lg mb-4">No has generado ninguna solicitud aún.</p>
                                        <button
                                            onClick={handleNewAlta}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all font-bold"
                                        >
                                            Crear mi primera solicitud
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-gray-50 border-b border-gray-100">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                                        <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                                                        <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Usuario</th>
                                                        <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                                        <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {currentItems.map((sol: SolicitudConSistemas) => (
                                                        <tr key={sol.id} className="hover:bg-blue-50/30 transition-colors group">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="text-sm font-medium text-gray-600">
                                                                    {new Date(sol.fechaCreacion).toLocaleDateString()}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${sol.tipo === 'ALTA' ? 'bg-green-100 text-green-700' :
                                                                    sol.tipo === 'BAJA' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                                    }`}>
                                                                    {sol.tipo === 'MODIFICACION' ? 'MODIFICACIÓN' : sol.tipo}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-gray-800">{sol.usuarioObjetivoNombre}</span>
                                                                    <span className="text-[11px] text-gray-500 font-medium uppercase">{sol.cargo || 'Funcionario'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${sol.estado === 'OBSERVADO' ? 'bg-orange-100 text-orange-700 animate-pulse' :
                                                                    sol.estado.includes('COMPLETADO') ? 'bg-green-100 text-green-700' :
                                                                        'bg-blue-100 text-blue-700'
                                                                    }`}>
                                                                    {sol.estado.replace(/_/g, ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                                {sol.estado === 'OBSERVADO' && (
                                                                    <button
                                                                        onClick={() => handleAnular(sol.id)}
                                                                        className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[10px] font-black transition-all border border-red-100"
                                                                        title="Anular Solicitud"
                                                                    >
                                                                        ANULAR
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleEdit(sol)}
                                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-sm ${sol.estado === 'OBSERVADO'
                                                                        ? 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-orange-200'
                                                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 uppercase tracking-tighter'
                                                                        }`}
                                                                >
                                                                    {sol.estado === 'OBSERVADO' ? 'CORREGIR' : 'DETALLES'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div className="flex justify-center items-center gap-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                                </button>
                                                <span className="text-sm font-bold text-gray-600">
                                                    Página {currentPage} de {totalPages}
                                                </span>
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fadeIn">
                            <PersonaDirectorio
                                isActionDisabled={hasPendingSolicitud}
                                isModificarHidden={(user) => (user.sistemas?.length || 0) >= totalSystemsCount}
                                onAction={(user) => {
                                    if (hasPendingSolicitud(user.id_usuario)) {
                                        toast.warning(`El usuario ${user.nombre} ya tiene una solicitud pendiente.`);
                                        return;
                                    }
                                    setUserForAlta(user);
                                    setFormMode('BAJA');
                                    setView('CREATE');
                                    toast.info(`Generando solicitud de baja para: ${user.nombre}`);
                                }}
                                onModificar={(user) => {
                                    if (hasPendingSolicitud(user.id_usuario)) {
                                        toast.warning(`El usuario ${user.nombre} ya tiene una solicitud pendiente.`);
                                        return;
                                    }
                                    setUserForAlta(user);
                                    setFormMode('MODIFICACION');
                                    setView('CREATE');
                                    toast.info(`Modificando sistemas para: ${user.nombre}`);
                                }}
                                onGenerarAlta={(user) => {
                                    if (hasPendingSolicitud(user.id_usuario)) {
                                        toast.warning(`El usuario ${user.nombre} ya tiene una solicitud pendiente.`);
                                        return;
                                    }
                                    setUserForAlta(user);
                                    setFormMode('ALTA');
                                    setView('CREATE');
                                    toast.info(`Generando alta para: ${user.nombre}`);
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {(view === 'CREATE' || view === 'EDIT') && (
                <div className="animate-slideUp">
                    <OgaAltaForm
                        mode={formMode}
                        solicitudEdit={solicitudToEdit || undefined}
                        initialUser={userForAlta}
                        onSuccess={handleSuccess}
                        onCancel={() => { setView('LIST'); setUserForAlta(undefined); setFormMode('ALTA'); }}
                    />
                </div>
            )}

            {view === 'DETAIL' && solicitudToEdit && (
                <div className="animate-slideUp">
                    <SolicitudReadDetail
                        solicitud={solicitudToEdit}
                        onBack={() => setView('LIST')}
                    />
                </div>
            )}

        </div>
    );
};
