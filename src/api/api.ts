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

// !IMPORTANTE: Cambiar a false cuando el backend PHP esté listo y conectado
export const USE_MOCK = true;

/**
 * Interfaces para funciones API
 */
// Reutilizamos el tipo de payload definido en el mock para consistencia
type CreateSolicitudPayload = mockBackend.CreateSolicitudPayload;


/**
 * IMPLEMENTACIONES REALES (Placeholders)
 * Aquí irían los fetch() reales a tu API PHP
 */
const realApi = {
    getCurrentUser: async (): Promise<Usuario> => {
        // Ejemplo:
        // const res = await fetch('/api/auth/me');
        // if (!res.ok) throw new Error('Error al obtener usuario');
        // return res.json();
        throw new Error('Real backend implementation not ready');
    },

    getOficinas: async (): Promise<Oficina[]> => {
        // const res = await fetch('/api/oficinas');
        // return res.json();
        throw new Error('Real backend implementation not ready');
    },

    getSistemasAlta: async (): Promise<Sistema[]> => {
        // const res = await fetch('/api/sistemas?tipo=ALTA&estado=ACTIVO');
        // return res.json();
        throw new Error('Real backend implementation not ready');
    },

    createSolicitudAlta: async (_payload: CreateSolicitudPayload): Promise<SolicitudConSistemas> => {
        // const res = await fetch('/api/solicitudes', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(payload)
        // });
        // return res.json();
        throw new Error('Real backend implementation not ready');
    },

    getSolicitudesPendientesAlta: async (): Promise<SolicitudConSistemas[]> => {
        // const res = await fetch('/api/solicitudes?tipo=ALTA&estado=PENDIENTE');
        // return res.json();
        throw new Error('Real backend implementation not ready');
    },

    cambiarEstadoSolicitud: async (_id: string, _nuevoEstado: EstadoSolicitud): Promise<SolicitudConSistemas> => {
        // const res = await fetch(`/api/solicitudes/${id}/estado`, {
        //   method: 'PUT', // o PATCH
        //   body: JSON.stringify({ estado: nuevoEstado })
        // });
        // return res.json();
        throw new Error('Real backend implementation not ready');
    },

    marcarSistemaCompletado: async (_solicitudId: string, _sistemaId: string): Promise<SolicitudConSistemas> => {
        // const res = await fetch(`/api/solicitudes/${solicitudId}/sistemas/${sistemaId}/completar`, {
        //   method: 'PUT'
        // });
        // return res.json();
        throw new Error('Real backend implementation not ready');
    },

    getMisSolicitudes: async (_userId: string): Promise<SolicitudConSistemas[]> => {
        throw new Error('Real backend implementation not ready');
    },

    getSolicitudById: async (_id: string): Promise<SolicitudConSistemas | undefined> => {
        throw new Error('Real backend implementation not ready');
    },

    updateSolicitud: async (_id: string, _payload: mockBackend.UpdateSolicitudPayload): Promise<SolicitudConSistemas> => {
        throw new Error('Real backend implementation not ready');
    },

    getSolicitudesParaValidar: async (): Promise<SolicitudConSistemas[]> => {
        throw new Error('Real backend implementation not ready');
    },

    getPersonal: async (): Promise<Usuario[]> => {
        throw new Error('Real backend implementation not ready');
    },

    aprobarSolicitud: async (_id: string): Promise<SolicitudConSistemas> => {
        throw new Error('Real backend implementation not ready');
    },

    rechazarSolicitud: async (_id: string, _motivo: string): Promise<SolicitudConSistemas> => {
        throw new Error('Real backend implementation not ready');
    },

    // Bajas
    createSolicitudBaja: async (_userId: string, _sistemasIds: string[]): Promise<SolicitudConSistemas> => {
        throw new Error('Real backend implementation not ready');
    },

    getSolicitudesPendientesBaja: async (): Promise<SolicitudConSistemas[]> => {
        throw new Error('Real backend implementation not ready');
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
    createSolicitudAlta: USE_MOCK ? mockBackend.createSolicitudAlta : realApi.createSolicitudAlta,
    getSolicitudesPendientesAlta: USE_MOCK ? mockBackend.getSolicitudesPendientesAlta : realApi.getSolicitudesPendientesAlta,
    cambiarEstadoSolicitud: USE_MOCK ? mockBackend.cambiarEstadoSolicitud : realApi.cambiarEstadoSolicitud,
    marcarSistemaCompletado: USE_MOCK ? mockBackend.marcarSistemaCompletado : realApi.marcarSistemaCompletado,

    // Nuevas
    getMisSolicitudes: USE_MOCK ? mockBackend.getMisSolicitudes : realApi.getMisSolicitudes,
    getSolicitudById: USE_MOCK ? mockBackend.getSolicitudById : realApi.getSolicitudById,
    updateSolicitud: USE_MOCK ? mockBackend.updateSolicitud : realApi.updateSolicitud,

    // Jefatura & Validacion
    getSolicitudesParaValidar: USE_MOCK ? mockBackend.getSolicitudesParaValidar : realApi.getSolicitudesParaValidar,
    getPersonal: USE_MOCK ? mockBackend.getPersonal : realApi.getPersonal,
    aprobarSolicitud: USE_MOCK ? mockBackend.aprobarSolicitud : realApi.aprobarSolicitud,
    rechazarSolicitud: USE_MOCK ? mockBackend.rechazarSolicitud : realApi.rechazarSolicitud,

    // Bajas
    createSolicitudBaja: USE_MOCK ? mockBackend.createSolicitudBaja : realApi.createSolicitudBaja,
    getSolicitudesPendientesBaja: USE_MOCK ? mockBackend.getSolicitudesPendientesBaja : realApi.getSolicitudesPendientesBaja,
};
