import React, { useEffect, useState } from 'react';
import { api } from '../shared/api/api';
import type { Oficina, Sistema, SolicitudConSistemas, Usuario } from '../shared/types/models';
import { toast } from 'sonner';

interface OgaAltaFormProps {
    mode: 'ALTA' | 'BAJA' | 'MODIFICACION';
    solicitudEdit?: SolicitudConSistemas; // Si viene, es edición
    initialUser?: Usuario; // Si viene, es pre-llenado para alta
    onSuccess: () => void;
    onCancel: () => void;
}

export const OgaAltaForm: React.FC<OgaAltaFormProps> = ({ mode, solicitudEdit, initialUser, onSuccess, onCancel }) => {
    const [oficinas, setOficinas] = useState<Oficina[]>([]);
    const [sistemas, setSistemas] = useState<Sistema[]>([]);

    // Estados del formulario
    const [nombre, setNombre] = useState('');
    const [dni, setDni] = useState('');
    const [cargo, setCargo] = useState('');
    const [oficinaId, setOficinaId] = useState('');

    // Estado para selección: record de ID -> { selected, detalle, locked? }
    const [seleccionSistemas, setSeleccionSistemas] = useState<Record<string, { selected: boolean; detalle: string; locked?: boolean }>>({});

    const [archivoSustento, setArchivoSustento] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    // Nota: El estado 'message' local ha sido reemplazado por Toasts globales para mejorar la UI.

    // Modos: ALTA, BAJA, MODIFICACION (Ahora viene por prop)

    // Carga inicial de datos maestros
    useEffect(() => {
        const loadData = async () => {
            try {
                // Obtenemos oficinas y sistemas según el modo
                // Para BAJA y MODIFICACION usaremos getSistemasAlta por defecto (catálogo completo)
                // Pero controlaremos la visualización en el renderizado
                const [oficinasData, sistemasCat] = await Promise.all([
                    api.getOficinas(),
                    api.getSistemas()
                ]);
                setOficinas(oficinasData);
                setSistemas(sistemasCat);

                // -- MODO CREACIÓN o PRE-LLENADO --
                if (!solicitudEdit) {
                    if (initialUser) {
                        // Los datos del usuario determinan los sistemas a mostrar

                        // Pre-llenar con datos del usuario
                        setNombre(initialUser.nombre);
                        setDni(initialUser.documento || '');
                        setCargo(initialUser.cargo || '');
                        setOficinaId(initialUser.oficinaId || (oficinasData.length > 0 ? oficinasData[0].id : ''));

                        // Inicializar selección
                        const initialSelection: Record<string, { selected: boolean; detalle: string; locked?: boolean }> = {};
                        sistemasCat.forEach(s => {
                            const userHasIt = initialUser.sistemas?.includes(s.id);
                            initialSelection[s.id] = {
                                selected: userHasIt || false,
                                detalle: '',
                                locked: userHasIt // Para MODIFICACIÓN, los que ya tiene se bloquean
                            };
                        });
                        setSeleccionSistemas(initialSelection);

                    } else {
                        if (oficinasData.length > 0) setOficinaId(oficinasData[0].id);
                        const initialSelection: Record<string, { selected: boolean; detalle: string }> = {};
                        sistemasCat.forEach(s => {
                            initialSelection[s.id] = { selected: false, detalle: '' };
                        });
                        setSeleccionSistemas(initialSelection);
                    }
                } else {
                    // -- MODO EDICIÓN --
                    setNombre(solicitudEdit.usuarioObjetivoNombre);
                    setDni(solicitudEdit.usuarioObjetivoDniRuc);
                    setCargo(solicitudEdit.cargo);
                    setOficinaId(solicitudEdit.oficinaId);

                    const selection: Record<string, { selected: boolean; detalle: string }> = {};
                    sistemasCat.forEach(s => {
                        selection[s.id] = { selected: false, detalle: '' };
                    });

                    solicitudEdit.sistemas.forEach(sis => {
                        if (selection[sis.sistemaId]) {
                            selection[sis.sistemaId] = {
                                selected: true,
                                detalle: sis.detalle || ''
                            };
                        }
                    });
                    setSeleccionSistemas(selection);
                }

            } catch (error) {
                console.error('Error cargando datos:', error);
                toast.error('Error cargando datos maestros.');
            }
        };
        loadData();
    }, [solicitudEdit, initialUser]);


    const handleSystemCheck = (sistemaId: string, checked: boolean) => {
        setSeleccionSistemas(prev => ({
            ...prev,
            [sistemaId]: { ...prev[sistemaId], selected: checked }
        }));
    };

    const handleSystemDetailChange = (sistemaId: string, detalle: string) => {
        setSeleccionSistemas(prev => ({
            ...prev,
            [sistemaId]: { ...prev[sistemaId], detalle }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const sistemasSeleccionadosIds = Object.keys(seleccionSistemas).filter(id => {
            if (mode === 'MODIFICACION') {
                // En modificación, solo enviar los que NO estaban bloqueados (los nuevos)
                return seleccionSistemas[id].selected && !seleccionSistemas[id].locked;
            }
            return seleccionSistemas[id].selected;
        });

        if (sistemasSeleccionadosIds.length === 0 && mode !== 'BAJA') {
            toast.error('Debe seleccionar al menos un sistema nuevo.');
            setLoading(false);
            return;
        }

        if (mode === 'BAJA' && Object.keys(seleccionSistemas).filter(id => seleccionSistemas[id].selected).length === 0) {
            toast.error('Debe seleccionar al menos un sistema para dar de baja.');
            setLoading(false);
            return;
        }

        try {
            const currentUser = await api.getCurrentUser();

            if (mode === 'BAJA' && initialUser) {
                const idsParaBaja = Object.keys(seleccionSistemas).filter(id => seleccionSistemas[id].selected);
                await api.createSolicitudBaja(initialUser.id_usuario, idsParaBaja, archivoSustento || undefined);
                toast.success('Solicitud de baja creada con éxito!');
            } else if (solicitudEdit) {
                const payload: any = {
                    usuarioObjetivoNombre: nombre,
                    usuarioObjetivoDniRuc: dni,
                    cargo: cargo,
                    oficinaId: parseInt(oficinaId),
                    creadoPorId: currentUser.id_usuario,
                    sistemas: sistemasSeleccionadosIds.map(sisId => ({
                        sistemaId: sisId,
                        detalle: seleccionSistemas[sisId].detalle || undefined
                    }))
                };
                if (solicitudEdit.estado === 'OBSERVADO') {
                    payload.id_estado_solicitud = 1;
                }
                await api.updateSolicitud(solicitudEdit.id, payload);
                toast.success('Solicitud actualizada correctamente.');
            } else {
                // ALTA o MODIFICACION (nueva)
                const payload: any = {
                    usuarioObjetivoId: initialUser?.id_usuario || 0,
                    usuarioObjetivoNombre: nombre,
                    usuarioObjetivoDniRuc: dni,
                    cargo: cargo,
                    oficinaId: parseInt(oficinaId),
                    creadoPorId: currentUser.id_usuario,
                    sistemas: sistemasSeleccionadosIds.map(sisId => ({
                        sistemaId: sisId,
                        detalle: seleccionSistemas[sisId].detalle || undefined
                    }))
                };

                if (mode === 'MODIFICACION') {
                    await api.createSolicitudModificacion(payload, archivoSustento || undefined);
                } else {
                    await api.createSolicitudAlta(payload, archivoSustento || undefined);
                }
                toast.success(mode === 'ALTA' ? 'Solicitud de alta creada!' : 'Solicitud de modificación creada!');
            }

            setTimeout(() => {
                onSuccess();
            }, 1000);

        } catch (error) {
            console.error(error);
            toast.error('Error al procesar la solicitud.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {solicitudEdit ? 'Editar Solicitud' : (
                        mode === 'ALTA' ? 'Nueva Solicitud de Alta' :
                            mode === 'BAJA' ? 'Solicitud de Baja' : 'Modificación de Sistemas'
                    )}
                </h2>
                {solicitudEdit && (
                    <div className="flex flex-col items-end">
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                            Editando: {solicitudEdit.id}
                        </span>
                        {solicitudEdit.estado === 'OBSERVADO' && (
                            <span className="mt-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold animate-pulse">
                                REQUIERE CORRECCIÓN
                            </span>
                        )}
                    </div>
                )}
            </div>

            {
                solicitudEdit?.estado === 'OBSERVADO' && solicitudEdit.motivo && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-4 items-start animate-fadeIn">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-red-800 uppercase tracking-tight">Motivo de Observación:</h4>
                            <p className="text-sm text-red-700 mt-0.5">{solicitudEdit.motivo}</p>
                        </div>
                    </div>
                )
            }


            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">DNI / RUC</label>
                        <input
                            type="text"
                            value={dni}
                            onChange={e => setDni(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej: 12345678"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Cargo</label>
                        <input
                            type="text"
                            value={cargo}
                            onChange={e => setCargo(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej: Analista"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Oficina Destino</label>
                        <div className="relative">
                            <select
                                value={oficinaId}
                                onChange={e => setOficinaId(e.target.value)}
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                            >
                                <option value="" disabled>-- Seleccione Oficina --</option>
                                {oficinas.map(of => (
                                    <option key={of.id} value={of.id}>{of.nombre}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Documento de Sustento (Opcional)</label>
                    <div className="flex items-center gap-4">
                        <label className="flex-1 flex flex-col items-center justify-center px-4 py-3 bg-white text-blue-600 rounded-lg shadow-sm tracking-wide border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <span className="mt-1 text-sm">{archivoSustento ? archivoSustento.name : 'Seleccionar archivo (PDF, Imagen)'}</span>
                            <input
                                type='file'
                                className="hidden"
                                onChange={e => setArchivoSustento(e.target.files?.[0] || null)}
                                accept=".pdf,image/*"
                            />
                        </label>
                        {archivoSustento && (
                            <button
                                type="button"
                                onClick={() => setArchivoSustento(null)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-400 italic">Formatos permitidos: PDF, JPG, PNG. Tamaño máx: 5MB.</p>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                        {mode === 'BAJA' ? 'Sistemas a Retirar' : 'Sistemas Requeridos'}
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                        {sistemas
                            .filter(sis => {
                                // Si estamos editando una solicitud existente (ej. una observada), 
                                // debemos mostrar todos los sistemas posibles para permitir correcciones completas.
                                if (solicitudEdit) return true;

                                if (mode === 'BAJA') {
                                    // Solo los que tiene y que se pueden dar de baja
                                    return initialUser?.sistemas?.includes(sis.id) && sis.aplicaBaja;
                                }
                                if (mode === 'ALTA' && initialUser) {
                                    // Solo los que NO tiene y que se pueden dar de alta
                                    return !initialUser.sistemas?.includes(sis.id) && sis.aplicaAlta;
                                }
                                if (mode === 'ALTA') {
                                    return sis.aplicaAlta;
                                }
                                // Por defecto mostrar todo (MODIFICACION u otros)
                                return true;
                            })
                            .map(sis => {
                                const sel = seleccionSistemas[sis.id] || { selected: false, detalle: '', locked: false };
                                const isSelected = sel.selected;
                                const isLocked = sel.locked && mode === 'MODIFICACION';

                                return (
                                    <div
                                        key={sis.id}
                                        className={`
                                            p-4 rounded-lg border transition-all duration-200
                                            ${isSelected ? (mode === 'BAJA' ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50') : 'border-gray-200 hover:border-blue-300'}
                                            ${isLocked ? 'opacity-75 bg-gray-50' : ''}
                                        `}
                                    >
                                        <label className={`flex items-center ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    disabled={isLocked}
                                                    onChange={e => handleSystemCheck(sis.id, e.target.checked)}
                                                    className={`peer h-5 w-5 appearance-none rounded border border-gray-300 shadow-sm focus:ring-2 focus:ring-offset-0 ${mode === 'BAJA'
                                                        ? 'checked:border-red-500 checked:bg-red-500 focus:ring-red-500'
                                                        : 'checked:border-blue-500 checked:bg-blue-500 focus:ring-blue-500'
                                                        } ${isLocked ? 'bg-gray-200 border-gray-400' : 'cursor-pointer'}`}
                                                />
                                                <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <span className="font-medium text-gray-700">{sis.nombre}</span>
                                                {isLocked && <span className="ml-2 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase">Ya asignado</span>}
                                            </div>
                                        </label>

                                        {sis.requiereDetalle && isSelected && mode !== 'BAJA' && (
                                            <div className="mt-3 ml-8 animate-fadeIn">
                                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                                    Detalle requerido (Rutas, nombres, etc)
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    disabled={isLocked}
                                                    className="w-full p-2 text-sm rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                                                    value={sel.detalle}
                                                    onChange={e => handleSystemDetailChange(sis.id, e.target.value)}
                                                    placeholder='Especifique detalles necesarios...'
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors focus:ring-4 focus:ring-gray-100"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`
                    flex-1 px-6 py-3 rounded-lg font-semibold text-white shadow-lg transition-all focus:ring-4 focus:ring-blue-200
                    ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:shadow-blue-500/25'}
                `}
                    >
                        {loading ? 'Guardando...' : (solicitudEdit ? 'Guardar Cambios' : 'Crear Solicitud')}
                    </button>
                </div>

            </form>
        </div>
    );
};
