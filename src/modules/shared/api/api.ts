import type {
    Usuario,
    Oficina,
    Sistema,
    SolicitudConSistemas,
    EstadoSolicitud
} from '../types/models';
import * as mockBackend from './mockBackend';

/**
 * API UNIFICADA
 * =============
 * Este archivo es el ÚNICO punto de acceso a datos para los componentes frontend.
 * 
 * PROPÓSITO:
 * Abstraer la fuente de datos. Los componentes no deben saber si los datos vienen
 * de un mock local o del servidor real.
 */

// !IMPORTANTE: Cambiar a false cuando el backend Node.js esté listo y conectado
export const USE_MOCK = false;
const BACKEND_URL = import.meta.env.BACKEND_URL || 'http://localhost:3001/api';

/**
 * Interfaces para funciones API
 */
export interface CreateSolicitudPayload {
    usuarioObjetivoNombre: string;
    usuarioObjetivoDniRuc: string;
    cargo: string;
    oficinaId: number;
    creadoPorId: string;
    sistemas: {
        sistemaId: string;
        detalle?: string;
    }[];
}

export type UpdateSolicitudPayload = Partial<CreateSolicitudPayload>;


/**
 * IMPLEMENTACIONES REALES
 * Conecta con el servidor Node.js + Sequelize
 */
const realApi = {
    getCurrentUser: async (): Promise<Usuario> => {
        const users = await realApi.getPersonal();
        if (users.length > 0) return users[0];
        return mockBackend.getCurrentUser();
    },

    getSistemas: async (): Promise<Sistema[]> => {
        const res = await fetch(`${BACKEND_URL}/sistemas`);
        if (!res.ok) throw new Error('Error al obtener sistemas');
        const data = await res.json();
        return data.map((s: any) => ({
            id: s.id_sistema.toString(),
            nombre: s.nombre,
            aplicaAlta: !!s.aplica_alta,
            aplicaBaja: !!s.aplica_baja,
            requiereDetalle: !!s.requiere_detalle
        }));
    },
    getOficinas: async (): Promise<Oficina[]> => {
        const res = await fetch(`${BACKEND_URL}/areas`);
        if (!res.ok) throw new Error('Error al obtener áreas');
        const data = await res.json();
        return data.map((a: any) => ({
            id: a.id_area.toString(),
            nombre: a.area
        }));
    },

    getSistemasAlta: async (): Promise<Sistema[]> => {
        const res = await fetch(`${BACKEND_URL}/sistemas`);
        if (!res.ok) throw new Error('Error al obtener sistemas');
        const data = await res.json();
        return data.filter((s: any) => s.aplica_alta && s.estado === 1).map((s: any) => ({
            id: s.id_sistema.toString(),
            nombre: s.nombre,
            requiereDetalle: s.requiere_detalle
        }));
    },

    getSistemasBaja: async (): Promise<Sistema[]> => {
        const res = await fetch(`${BACKEND_URL}/sistemas`);
        if (!res.ok) throw new Error('Error al obtener sistemas');
        const data = await res.json();
        return data.filter((s: any) => s.aplica_baja && s.estado === 1).map((s: any) => ({
            id: s.id_sistema.toString(),
            nombre: s.nombre,
            requiereDetalle: s.requiere_detalle
        }));
    },

    createSolicitudAlta: async (payload: any, archivo?: File): Promise<void> => {
        const formData = new FormData();
        formData.append('tipo', 'ALTA');
        formData.append('usuario_objetivo_nombre', payload.usuarioObjetivoNombre);
        formData.append('usuario_objetivo_dni_ruc', payload.usuarioObjetivoDniRuc);
        formData.append('cargo', payload.cargo);
        formData.append('id_area', payload.oficinaId);
        formData.append('id_creado_por', payload.creadoPorId);
        formData.append('id_usuario_objetivo', payload.usuarioObjetivoId?.toString() || '0');

        const sistemasMapping = payload.sistemas.map((s: any) => ({
            id_sistema: parseInt(s.sistemaId),
            detalle: s.detalle
        }));
        formData.append('sistemas', JSON.stringify(sistemasMapping));

        if (archivo) {
            formData.append('archivo', archivo);
        }

        const res = await fetch(`${BACKEND_URL}/solicitudes`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error('Error al crear solicitud de alta');
    },

    createSolicitudModificacion: async (payload: any, archivo?: File): Promise<void> => {
        const formData = new FormData();
        formData.append('tipo', 'MODIFICACION');
        formData.append('usuario_objetivo_nombre', payload.usuarioObjetivoNombre);
        formData.append('usuario_objetivo_dni_ruc', payload.usuarioObjetivoDniRuc);
        formData.append('cargo', payload.cargo);
        formData.append('id_area', payload.oficinaId);
        formData.append('id_creado_por', payload.creadoPorId);
        formData.append('id_usuario_objetivo', payload.usuarioObjetivoId?.toString() || '0');

        const sistemasMapping = payload.sistemas.map((s: any) => ({
            id_sistema: parseInt(s.sistemaId),
            detalle: s.detalle
        }));
        formData.append('sistemas', JSON.stringify(sistemasMapping));

        if (archivo) {
            formData.append('archivo', archivo);
        }

        const res = await fetch(`${BACKEND_URL}/solicitudes`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error('Error al crear solicitud de modificación');
    },

    getSolicitudesPendientesAlta: async (): Promise<SolicitudConSistemas[]> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes`);
        if (!res.ok) throw new Error('Error al obtener solicitudes');
        const data = await res.json();
        return data.filter((s: any) => s.tipo === 'ALTA' && ['PENDIENTE_OGA', 'EN_PROCESO_USEI', 'TECNICO_ETIC'].includes(s.tbl_estado_solicitud?.nombre)).map((s: any) => {
            const nombreEstado = s.tbl_estado_solicitud?.nombre;
            let estado: any = 'PENDIENTE_ALTA';
            if (nombreEstado === 'EN_PROCESO_USEI') {
                estado = `EN_PROCESO_${s.tipo}` as any;
            } else if (nombreEstado === 'TECNICO_ETIC') {
                estado = `TECNICO_${s.tipo}` as any;
            } else if (nombreEstado === 'PARA_VALIDAR') {
                estado = `PARA_VALIDAR_${s.tipo}` as any;
            }

            return {
                id: s.id_solicitud.toString(),
                tipo: s.tipo,
                usuarioObjetivoId: s.id_usuario_objetivo,
                usuarioObjetivoNombre: s.usuario_objetivo_nombre,
                usuarioObjetivoDniRuc: s.usuario_objetivo_dni_ruc,
                cargo: s.cargo,
                oficinaId: s.id_area.toString(),
                oficinaNombre: s.tbl_area?.area || 'Sin área',
                estado: estado,
                creadoPorId: s.id_creado_por.toString(),
                documentoSustento: s.archivo_sustento,
                sistemas: s.tbl_solicitud_sistemas?.map((ss: any) => ({
                    id: ss.id_solicitud_sistema.toString(),
                    sistemaId: ss.id_sistema.toString(),
                    sistemaNombre: ss.tbl_sistema?.nombre || 'S/N',
                    detalle: ss.detalle,
                    estadoAtencion: ss.estado_atencion
                })) || []
            };
        });
    },

    getSolicitudesPendientesModificacion: async (): Promise<SolicitudConSistemas[]> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes`);
        if (!res.ok) throw new Error('Error al obtener solicitudes');
        const data = await res.json();
        return data.filter((s: any) => s.tipo === 'MODIFICACION' && ['PENDIENTE_OGA', 'EN_PROCESO_USEI', 'TECNICO_ETIC'].includes(s.tbl_estado_solicitud?.nombre)).map((s: any) => {
            const nombreEstado = s.tbl_estado_solicitud?.nombre;
            let estado: any = 'PENDIENTE_MODIFICACION';
            if (nombreEstado === 'EN_PROCESO_USEI') {
                estado = `EN_PROCESO_${s.tipo}` as any;
            } else if (nombreEstado === 'TECNICO_ETIC') {
                estado = `TECNICO_${s.tipo}` as any;
            } else if (nombreEstado === 'PARA_VALIDAR') {
                estado = `PARA_VALIDAR_${s.tipo}` as any;
            }

            return {
                id: s.id_solicitud.toString(),
                tipo: s.tipo,
                usuarioObjetivoId: s.id_usuario_objetivo,
                usuarioObjetivoNombre: s.usuario_objetivo_nombre,
                usuarioObjetivoDniRuc: s.usuario_objetivo_dni_ruc,
                cargo: s.cargo,
                oficinaId: s.id_area.toString(),
                oficinaNombre: s.tbl_area?.area || 'Sin área',
                estado: estado,
                creadoPorId: s.id_creado_por.toString(),
                documentoSustento: s.archivo_sustento,
                sistemas: s.tbl_solicitud_sistemas?.map((ss: any) => ({
                    id: ss.id_solicitud_sistema.toString(),
                    sistemaId: ss.id_sistema.toString(),
                    sistemaNombre: ss.tbl_sistema?.nombre || 'S/N',
                    detalle: ss.detalle,
                    estadoAtencion: ss.estado_atencion
                })) || []
            };
        });
    },

    cambiarEstadoSolicitud: async (id: string | number, nuevoEstado: EstadoSolicitud): Promise<any> => {
        const estadoMap: Record<string, number> = {
            'PENDIENTE_ALTA': 1,
            'EN_PROCESO_ALTA': 2,
            'TECNICO_ALTA': 3,
            'PARA_VALIDAR_ALTA': 4,
            'COMPLETADO_ALTA': 5,
            'PENDIENTE_BAJA': 1,
            'EN_PROCESO_BAJA': 2,
            'TECNICO_BAJA': 3,
            'PARA_VALIDAR_BAJA': 4,
            'COMPLETADO_BAJA': 5,
            'PENDIENTE_MODIFICACION': 1,
            'EN_PROCESO_MODIFICACION': 2,
            'TECNICO_MODIFICACION': 3,
            'PARA_VALIDAR_MODIFICACION': 4,
            'COMPLETADO_MODIFICACION': 5,
            'OBSERVADO': 6,
            'ANULADO': 7
        };

        const res = await fetch(`${BACKEND_URL}/solicitudes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_estado_solicitud: estadoMap[nuevoEstado] })
        });
        if (!res.ok) throw new Error('Error al actualizar estado');
        return res.json();
    },

    marcarSistemaCompletado: async (solicitudId: string, sistemaId: string, estado: 'PENDIENTE' | 'COMPLETADO' = 'COMPLETADO'): Promise<any> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes/${solicitudId}/sistemas/${sistemaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado_atencion: estado })
        });
        if (!res.ok) throw new Error('Error al actualizar sistema');
        const s = await res.json();
        return {
            id: s.id_solicitud.toString(),
            tipo: s.tipo,
            usuarioObjetivoId: s.id_usuario_objetivo,
            usuarioObjetivoNombre: s.usuario_objetivo_nombre,
            usuarioObjetivoDniRuc: s.usuario_objetivo_dni_ruc,
            cargo: s.cargo,
            oficinaId: s.id_area.toString(),
            oficinaNombre: s.tbl_area?.area || 'Sin área',
            estado: s.tbl_estado_solicitud?.nombre === 'EN PROCESO' ? (s.tipo === 'ALTA' ? 'EN_PROCESO_ALTA' : 'EN_PROCESO_BAJA') : (s.tipo === 'ALTA' ? 'PENDIENTE_ALTA' : 'PENDIENTE_BAJA'),
            creadoPorId: s.id_creado_por.toString(),
            fechaCreacion: s.createdAt,
            sistemas: s.tbl_solicitud_sistemas?.map((ss: any) => ({
                id: ss.id_solicitud_sistema.toString(),
                sistemaId: ss.id_sistema.toString(),
                sistemaNombre: ss.tbl_sistema?.nombre || 'S/N',
                detalle: ss.detalle,
                estadoAtencion: ss.estado_atencion
            })) || []
        };
    },

    getMisSolicitudes: async (userId: string): Promise<SolicitudConSistemas[]> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes`);
        if (!res.ok) throw new Error('Error al obtener solicitudes');
        const data = await res.json();
        return data.filter((s: any) => s.id_creado_por.toString() === userId).map((s: any) => {
            const nombreEstado = s.tbl_estado_solicitud?.nombre || 'PENDIENTE_OGA';
            let estado: EstadoSolicitud;

            if (nombreEstado === 'OBSERVADO' || nombreEstado === 'ANULADO') {
                estado = nombreEstado as any;
            } else if (nombreEstado === 'PENDIENTE_OGA') {
                estado = `PENDIENTE_${s.tipo}` as any;
            } else if (nombreEstado === 'EN_PROCESO_USEI' || nombreEstado === 'TECNICO_ETIC') {
                estado = `EN_PROCESO_${s.tipo}` as any;
            } else if (nombreEstado === 'PARA_VALIDAR') {
                estado = `PARA_VALIDAR_${s.tipo}` as any;
            } else if (nombreEstado === 'COMPLETADO') {
                estado = `COMPLETADO_${s.tipo}` as any;
            } else {
                estado = `PENDIENTE_${s.tipo}` as any;
            }

            return {
                id: s.id_solicitud.toString(),
                tipo: (s.tipo?.toUpperCase() || 'MODIFICACION') as any,
                usuarioObjetivoId: s.id_usuario_objetivo,
                usuarioObjetivoNombre: s.usuario_objetivo_nombre,
                usuarioObjetivoDniRuc: s.usuario_objetivo_dni_ruc,
                cargo: s.cargo,
                oficinaId: s.id_area.toString(),
                oficinaNombre: s.tbl_area?.area || 'Sin área',
                estado: estado,
                creadoPorId: s.id_creado_por.toString(),
                documentoSustento: s.archivo_sustento,
                fechaCreacion: s.createdAt || s.created_at || s.fecha_creacion || new Date().toISOString(),
                motivo: s.motivo_observacion,
                sistemas: s.tbl_solicitud_sistemas?.map((ss: any) => ({
                    id: ss.id_solicitud_sistema.toString(),
                    sistemaId: ss.id_sistema.toString(),
                    sistemaNombre: ss.tbl_sistema?.nombre || 'S/N',
                    detalle: ss.detalle,
                    estadoAtencion: ss.estado_atencion
                })) || []
            };
        });
    },

    getSolicitudById: async (id: string): Promise<SolicitudConSistemas | undefined> => {
        return mockBackend.getSolicitudById(id);
    },

    updateSolicitud: async (id: string | number, payload: any): Promise<any> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Error al actualizar solicitud');
        return res.json();
    },

    getSolicitudesParaValidar: async (): Promise<SolicitudConSistemas[]> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes`);
        if (!res.ok) throw new Error('Error al obtener solicitudes');
        const data = await res.json();
        return data.filter((s: any) => s.tbl_estado_solicitud?.nombre === 'PARA_VALIDAR').map((s: any) => ({
            id: s.id_solicitud.toString(),
            tipo: s.tipo,
            usuarioObjetivoId: s.id_usuario_objetivo,
            usuarioObjetivoNombre: s.usuario_objetivo_nombre,
            usuarioObjetivoDniRuc: s.usuario_objetivo_dni_ruc,
            cargo: s.cargo,
            oficinaId: s.id_area.toString(),
            oficinaNombre: s.tbl_area?.area || 'Sin área',
            estado: `PARA_VALIDAR_${s.tipo}` as any,
            creadoPorId: s.id_creado_por.toString(),
            documentoSustento: s.archivo_sustento,
            sistemas: s.tbl_solicitud_sistemas?.map((ss: any) => ({
                id: ss.id_solicitud_sistema.toString(),
                sistemaId: ss.id_sistema.toString(),
                sistemaNombre: ss.tbl_sistema?.nombre || 'S/N',
                detalle: ss.detalle,
                estadoAtencion: ss.estado_atencion
            })) || []
        }));
    },

    getSolicitudesValidadas: async (): Promise<SolicitudConSistemas[]> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes`);
        if (!res.ok) throw new Error('Error al obtener solicitudes');
        const data = await res.json();
        return data.filter((s: any) => s.tbl_estado_solicitud?.nombre === 'COMPLETADO').map((s: any) => ({
            id: s.id_solicitud.toString(),
            tipo: s.tipo,
            usuarioObjetivoId: s.id_usuario_objetivo,
            usuarioObjetivoNombre: s.usuario_objetivo_nombre,
            usuarioObjetivoDniRuc: s.usuario_objetivo_dni_ruc,
            cargo: s.cargo,
            oficinaId: s.id_area.toString(),
            oficinaNombre: s.tbl_area?.area || 'Sin área',
            estado: `COMPLETADO_${s.tipo}` as any,
            creadoPorId: s.id_creado_por.toString(),
            documentoSustento: s.archivo_sustento,
            sistemas: s.tbl_solicitud_sistemas?.map((ss: any) => ({
                id: ss.id_solicitud_sistema.toString(),
                sistemaId: ss.id_sistema.toString(),
                sistemaNombre: ss.tbl_sistema?.nombre || 'S/N',
                detalle: ss.detalle,
                estadoAtencion: ss.estado_atencion
            })) || []
        }));
    },

    getPersonal: async (): Promise<Usuario[]> => {
        const res = await fetch(`${BACKEND_URL}/personal`);
        if (!res.ok) throw new Error('Error al obtener personal de la DB');
        const data = await res.json();
        return data.map((u: any) => ({
            id: u.id_usuario.toString(),
            id_usuario: u.id_usuario,
            nombre: u.tbl_persona?.nombre || 'Sin nombre',
            documento: u.tbl_persona?.documento,
            cargo: u.tbl_persona?.cargo,
            correo: u.usuario || 'Sin correo',
            rol: u.id_rol === 1 ? 'OGA' : (u.id_rol === 2 ? 'ETIC' : 'JEFE_ETIC'),
            estado: u.id_estado === 8 ? 'ACTIVO' : 'INACTIVO',
            id_estado: u.id_estado,
            areaName: u.tbl_area?.area || 'Sin área',
            oficinaId: u.id_area?.toString(),
            sistemas: u.tbl_usuario_sistemas?.map((us: any) => us.id_sistema.toString()) || []
        }));
    },

    aprobarSolicitud: async (id: string | number): Promise<any> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes/${id}/aprobar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Error al aprobar solicitud');
        return res.json();
    },

    rechazarSolicitud: async (id: string | number, motivo: string): Promise<any> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes/${id}/rechazar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motivo })
        });
        if (!res.ok) throw new Error('Error al rechazar solicitud');
        return res.json();
    },

    createSolicitudBaja: async (userId: string | number, sistemasIds: string[], archivo?: File): Promise<void> => {
        const personal = await realApi.getPersonal();
        const user = personal.find((u: any) => u.id_usuario === (typeof userId === 'string' ? parseInt(userId) : userId));
        if (!user) throw new Error('Usuario no encontrado');

        const formData = new FormData();
        formData.append('tipo', 'BAJA');
        formData.append('usuario_objetivo_nombre', user.nombre);
        formData.append('usuario_objetivo_dni_ruc', user.documento || 'S/D');
        formData.append('cargo', user.cargo || 'S/C');
        formData.append('id_area', user.oficinaId || '0');
        formData.append('id_usuario_objetivo', user.id_usuario.toString());

        const currentUser = await realApi.getCurrentUser();
        formData.append('id_creado_por', currentUser.id_usuario.toString());

        const sistemasMapping = sistemasIds.map(id => ({
            id_sistema: parseInt(id),
            detalle: 'Baja de sistema'
        }));
        formData.append('sistemas', JSON.stringify(sistemasMapping));

        if (archivo) formData.append('archivo', archivo);

        const res = await fetch(`${BACKEND_URL}/solicitudes`, { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Error al crear baja');
    },

    getSolicitudesPendientesBaja: async (): Promise<SolicitudConSistemas[]> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes`);
        if (!res.ok) throw new Error('Error al obtener solicitudes');
        const data = await res.json();
        return data.filter((s: any) => s.tipo === 'BAJA' && ['PENDIENTE_OGA', 'EN_PROCESO_USEI', 'TECNICO_ETIC'].includes(s.tbl_estado_solicitud?.nombre)).map((s: any) => {
            const nombreEstado = s.tbl_estado_solicitud?.nombre;
            let estado: any = 'PENDIENTE_BAJA';
            if (nombreEstado === 'EN_PROCESO_USEI') {
                estado = 'EN_PROCESO_BAJA';
            } else if (nombreEstado === 'TECNICO_ETIC') {
                estado = 'TECNICO_BAJA';
            } else if (nombreEstado === 'PARA_VALIDAR') {
                estado = 'PARA_VALIDAR_BAJA';
            }

            return {
                id: s.id_solicitud.toString(),
                tipo: s.tipo,
                usuarioObjetivoId: s.id_usuario_objetivo,
                usuarioObjetivoNombre: s.usuario_objetivo_nombre,
                usuarioObjetivoDniRuc: s.usuario_objetivo_dni_ruc,
                cargo: s.cargo,
                oficinaId: s.id_area.toString(),
                oficinaNombre: s.tbl_area?.area || 'Sin área',
                estado: estado,
                creadoPorId: s.id_creado_por.toString(),
                documentoSustento: s.archivo_sustento,
                sistemas: s.tbl_solicitud_sistemas?.map((ss: any) => ({
                    id: ss.id_solicitud_sistema.toString(),
                    sistemaId: ss.id_sistema.toString(),
                    sistemaNombre: ss.tbl_sistema?.nombre || 'S/N',
                    detalle: ss.detalle,
                    estadoAtencion: ss.estado_atencion
                })) || []
            };
        });
    },

    getSistemasBase: async (): Promise<any[]> => {
        const res = await fetch(`${BACKEND_URL}/sistemas`);
        return res.json();
    },

    updateSistema: async (id: string | number, data: any): Promise<void> => {
        await fetch(`${BACKEND_URL}/sistemas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    createSistema: async (data: any): Promise<void> => {
        await fetch(`${BACKEND_URL}/sistemas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    cancelSolicitud: async (id: string | number): Promise<void> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_estado_solicitud: 7 })
        });
        if (!res.ok) throw new Error('Error al anular');
    }
};

export const api = {
    getCurrentUser: USE_MOCK ? mockBackend.getCurrentUser : realApi.getCurrentUser,
    getOficinas: USE_MOCK ? mockBackend.getOficinas : realApi.getOficinas,
    getSistemasAlta: USE_MOCK ? mockBackend.getSistemasAlta : realApi.getSistemasAlta,
    getSistemasBaja: USE_MOCK ? mockBackend.getSistemasBaja : realApi.getSistemasBaja,
    createSolicitudAlta: realApi.createSolicitudAlta,
    createSolicitudModificacion: realApi.createSolicitudModificacion,
    getSolicitudesPendientesAlta: USE_MOCK ? mockBackend.getSolicitudesPendientesAlta : realApi.getSolicitudesPendientesAlta,
    cambiarEstadoSolicitud: USE_MOCK ? mockBackend.cambiarEstadoSolicitud : realApi.cambiarEstadoSolicitud,
    marcarSistemaCompletado: USE_MOCK ? mockBackend.marcarSistemaCompletado : realApi.marcarSistemaCompletado,
    getMisSolicitudes: USE_MOCK ? mockBackend.getMisSolicitudes : realApi.getMisSolicitudes,
    getSolicitudById: USE_MOCK ? mockBackend.getSolicitudById : realApi.getSolicitudById,
    updateSolicitud: realApi.updateSolicitud,
    cancelSolicitud: realApi.cancelSolicitud,
    getSolicitudesParaValidar: USE_MOCK ? mockBackend.getSolicitudesParaValidar : realApi.getSolicitudesParaValidar,
    getSolicitudesValidadas: realApi.getSolicitudesValidadas,
    getPersonal: USE_MOCK ? mockBackend.getPersonal : realApi.getPersonal,
    aprobarSolicitud: realApi.aprobarSolicitud,
    rechazarSolicitud: realApi.rechazarSolicitud,
    createSolicitudBaja: realApi.createSolicitudBaja,
    getSolicitudesPendientesBaja: realApi.getSolicitudesPendientesBaja,
    getSolicitudesPendientesModificacion: realApi.getSolicitudesPendientesModificacion,
    getSistemasBase: realApi.getSistemasBase,
    updateSistema: realApi.updateSistema,
    createSistema: realApi.createSistema,
    getSistemas: realApi.getSistemas,
};
