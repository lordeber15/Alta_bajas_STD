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
const BACKEND_URL = 'http://localhost:3001/api';

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
        // En un escenario real, esto vendría de un token de sesión.
        // Para desarrollo con DB real, tomamos el primer usuario del personal.
        const users = await realApi.getPersonal();
        if (users.length > 0) return users[0];
        return mockBackend.getCurrentUser();
    },

    /**
     * Obtiene las áreas reales de la base de datos.
     */
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

        // El backend espera 'sistemas' como JSON stringified en FormData
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

    getSolicitudesPendientesAlta: async (): Promise<SolicitudConSistemas[]> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes`);
        if (!res.ok) throw new Error('Error al obtener solicitudes');
        const data = await res.json();
        return data.filter((s: any) => s.tipo === 'ALTA' && [1, 2].includes(s.id_estado_solicitud)).map((s: any) => ({
            id: s.id_solicitud.toString(),
            tipo: s.tipo,
            usuarioObjetivoNombre: s.usuario_objetivo_nombre,
            usuarioObjetivoDniRuc: s.usuario_objetivo_dni_ruc,
            cargo: s.cargo,
            oficinaId: s.id_area.toString(),
            estado: s.id_estado_solicitud === 2 ? 'EN_PROCESO_ALTA' : 'PENDIENTE_ALTA',
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

    cambiarEstadoSolicitud: async (id: string, nuevoEstado: EstadoSolicitud): Promise<any> => {
        // Mapeo de estados visuales a IDs de base de datos
        const estadoMap: Record<string, number> = {
            'PENDIENTE_ALTA': 1,
            'EN_PROCESO_ALTA': 2,
            'PARA_VALIDAR_ALTA': 3,
            'COMPLETADO_ALTA': 4,
            'PENDIENTE_BAJA': 1, // Usando 1 para pendientes por ahora
            'EN_PROCESO_BAJA': 2,
            'PARA_VALIDAR_BAJA': 3,
            'COMPLETADO_BAJA': 4,
            'OBSERVADO': 5
        };

        const res = await fetch(`${BACKEND_URL}/solicitudes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_estado_solicitud: estadoMap[nuevoEstado] })
        });
        if (!res.ok) throw new Error('Error al actualizar estado');
        return res.json();
    },

    marcarSistemaCompletado: async (solicitudId: string, sistemaId: string): Promise<any> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes/${solicitudId}/sistemas/${sistemaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado_atencion: 'COMPLETADO' })
        });
        if (!res.ok) throw new Error('Error al actualizar sistema');
        const s = await res.json();
        // Mapeo manual similar al de getSolicitudes...
        return {
            id: s.id_solicitud.toString(),
            tipo: s.tipo,
            usuarioObjetivoNombre: s.usuario_objetivo_nombre,
            usuarioObjetivoDniRuc: s.usuario_objetivo_dni_ruc,
            cargo: s.cargo,
            oficinaId: s.id_area.toString(),
            estado: s.id_estado_solicitud === 2 ? (s.tipo === 'ALTA' ? 'EN_PROCESO_ALTA' : 'EN_PROCESO_BAJA') : (s.tipo === 'ALTA' ? 'PENDIENTE_ALTA' : 'PENDIENTE_BAJA'),
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
            let estado: EstadoSolicitud = 'PENDIENTE_ALTA';
            const id = s.id_estado_solicitud;
            if (s.tipo === 'ALTA') {
                if (id === 1) estado = 'PENDIENTE_ALTA';
                else if (id === 2) estado = 'EN_PROCESO_ALTA';
                else if (id === 3) estado = 'PARA_VALIDAR_ALTA';
                else if (id === 4) estado = 'COMPLETADO_ALTA';
                else if (id === 5) estado = 'OBSERVADO';
            } else {
                if (id === 1) estado = 'PENDIENTE_BAJA';
                else if (id === 2) estado = 'EN_PROCESO_BAJA';
                else if (id === 3) estado = 'PARA_VALIDAR_BAJA';
                else if (id === 4) estado = 'COMPLETADO_BAJA';
                else if (id === 5) estado = 'OBSERVADO';
            }

            return {
                id: s.id_solicitud.toString(),
                tipo: s.tipo,
                usuarioObjetivoNombre: s.usuario_objetivo_nombre,
                usuarioObjetivoDniRuc: s.usuario_objetivo_dni_ruc,
                cargo: s.cargo,
                oficinaId: s.id_area.toString(),
                estado: estado,
                creadoPorId: s.id_creado_por.toString(),
                documentoSustento: s.archivo_sustento,
                motivo: s.motivo_rechazo, // Para solicitudes observadas
                fechaCreacion: s.createdAt,
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

    updateSolicitud: async (id: string, payload: any): Promise<any> => {
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
        return data.filter((s: any) => [3].includes(s.id_estado_solicitud)).map((s: any) => ({
            id: s.id_solicitud.toString(),
            tipo: s.tipo,
            usuarioObjetivoNombre: s.usuario_objetivo_nombre,
            usuarioObjetivoDniRuc: s.usuario_objetivo_dni_ruc,
            cargo: s.cargo,
            oficinaId: s.id_area.toString(),
            estado: s.tipo === 'ALTA' ? 'PARA_VALIDAR_ALTA' : 'PARA_VALIDAR_BAJA',
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
        return data.filter((s: any) => [4].includes(s.id_estado_solicitud)).map((s: any) => ({
            id: s.id_solicitud.toString(),
            tipo: s.tipo,
            usuarioObjetivoNombre: s.usuario_objetivo_nombre,
            usuarioObjetivoDniRuc: s.usuario_objetivo_dni_ruc,
            cargo: s.cargo,
            oficinaId: s.id_area.toString(),
            estado: s.tipo === 'ALTA' ? 'COMPLETADO_ALTA' : 'COMPLETADO_BAJA',
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

    /**
     * Obtiene el personal desde la base de datos real a través de la API Node.js.
     * Ahora retorna solo Usuarios con sus datos vinculados de Persona y Área.
     */
    getPersonal: async (): Promise<Usuario[]> => {
        const res = await fetch(`${BACKEND_URL}/personal`);
        if (!res.ok) throw new Error('Error al obtener personal de la DB');
        const data = await res.json();

        // Mapear el formato de la DB (tbl_usuario join tbl_persona join tbl_area)
        return data.map((u: any) => ({
            id: u.id_usuario.toString(), // Usamos id_usuario como ID principal para consistencia en lookup
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

    aprobarSolicitud: async (id: string): Promise<any> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes/${id}/aprobar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Error al aprobar solicitud');
        return res.json();
    },

    rechazarSolicitud: async (id: string, motivo: string): Promise<any> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes/${id}/rechazar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motivo })
        });
        if (!res.ok) throw new Error('Error al rechazar solicitud');
        return res.json();
    },

    // Bajas
    createSolicitudBaja: async (userId: string, sistemasIds: string[], archivo?: File): Promise<void> => {
        const personal = await realApi.getPersonal();
        const user = personal.find((u: any) => u.id === userId);

        if (!user) throw new Error('Usuario no encontrado en el directorio');

        const formData = new FormData();
        formData.append('tipo', 'BAJA');
        formData.append('usuario_objetivo_nombre', user.nombre);
        formData.append('usuario_objetivo_dni_ruc', user.documento || 'S/D');
        formData.append('cargo', user.cargo || 'S/C');
        formData.append('id_area', user.oficinaId || '0');

        const currentUser = await realApi.getCurrentUser();
        formData.append('id_creado_por', currentUser.id_usuario.toString());

        const sistemasMapping = sistemasIds.map(id => ({
            id_sistema: parseInt(id),
            detalle: 'Baja de sistema'
        }));
        formData.append('sistemas', JSON.stringify(sistemasMapping));

        if (archivo) {
            formData.append('archivo', archivo);
        }

        const res = await fetch(`${BACKEND_URL}/solicitudes`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error('Error al crear solicitud de baja');
    },

    getSolicitudesPendientesBaja: async (): Promise<SolicitudConSistemas[]> => {
        const res = await fetch(`${BACKEND_URL}/solicitudes`);
        if (!res.ok) throw new Error('Error al obtener solicitudes');
        const data = await res.json();
        return data.filter((s: any) => s.tipo === 'BAJA' && [1, 2].includes(s.id_estado_solicitud)).map((s: any) => ({
            id: s.id_solicitud.toString(),
            tipo: s.tipo,
            usuarioObjetivoNombre: s.usuario_objetivo_nombre,
            usuarioObjetivoDniRuc: s.usuario_objetivo_dni_ruc,
            cargo: s.cargo,
            oficinaId: s.id_area.toString(),
            estado: s.id_estado_solicitud === 2 ? 'EN_PROCESO_BAJA' : 'PENDIENTE_BAJA',
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

    // Gestión de Sistemas (Extra para Jefatura)
    getSistemasBase: async (): Promise<any[]> => {
        const res = await fetch(`${BACKEND_URL}/sistemas`);
        return res.json();
    },
    updateSistema: async (id: string, data: any): Promise<void> => {
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
    }
};

/**
 * EXPORTACIÓN DE API
 * Selecciona dinámicamente entre mock y real basado en USE_MOCK
 */
export const api = {
    getCurrentUser: USE_MOCK ? mockBackend.getCurrentUser : realApi.getCurrentUser,
    getOficinas: USE_MOCK ? mockBackend.getOficinas : realApi.getOficinas,
    getSistemasAlta: USE_MOCK ? mockBackend.getSistemasAlta : realApi.getSistemasAlta,
    getSistemasBaja: USE_MOCK ? mockBackend.getSistemasBaja : realApi.getSistemasBaja,

    createSolicitudAlta: async (payload: any, archivo?: File) => {
        if (USE_MOCK) return mockBackend.createSolicitudAlta(payload);
        return realApi.createSolicitudAlta(payload, archivo);
    },

    getSolicitudesPendientesAlta: USE_MOCK ? mockBackend.getSolicitudesPendientesAlta : realApi.getSolicitudesPendientesAlta,
    cambiarEstadoSolicitud: USE_MOCK ? mockBackend.cambiarEstadoSolicitud : realApi.cambiarEstadoSolicitud,
    marcarSistemaCompletado: USE_MOCK ? mockBackend.marcarSistemaCompletado : realApi.marcarSistemaCompletado,

    // Nuevas
    getMisSolicitudes: USE_MOCK ? mockBackend.getMisSolicitudes : realApi.getMisSolicitudes,
    getSolicitudById: USE_MOCK ? mockBackend.getSolicitudById : realApi.getSolicitudById,

    updateSolicitud: async (id: string, payload: any) => {
        if (USE_MOCK) return mockBackend.updateSolicitud(id, payload);
        return realApi.updateSolicitud(id, payload);
    },

    // Jefatura & Validacion
    getSolicitudesParaValidar: USE_MOCK ? mockBackend.getSolicitudesParaValidar : realApi.getSolicitudesParaValidar,
    getSolicitudesValidadas: USE_MOCK ? (async () => []) : realApi.getSolicitudesValidadas,
    getPersonal: USE_MOCK ? mockBackend.getPersonal : realApi.getPersonal,
    aprobarSolicitud: USE_MOCK ? mockBackend.aprobarSolicitud : realApi.aprobarSolicitud,
    rechazarSolicitud: USE_MOCK ? mockBackend.rechazarSolicitud : realApi.rechazarSolicitud,

    // Bajas
    createSolicitudBaja: async (userId: string, sistemasIds: string[], archivo?: File) => {
        if (USE_MOCK) return mockBackend.createSolicitudBaja(userId, sistemasIds);
        return realApi.createSolicitudBaja(userId, sistemasIds, archivo);
    },

    getSolicitudesPendientesBaja: USE_MOCK ? mockBackend.getSolicitudesPendientesBaja : realApi.getSolicitudesPendientesBaja,

    // Gestión de Sistemas
    getSistemasBase: USE_MOCK ? (async () => []) : realApi.getSistemasBase,
    updateSistema: USE_MOCK ? (async () => { }) : realApi.updateSistema,
    createSistema: USE_MOCK ? (async () => { }) : realApi.createSistema,
};

