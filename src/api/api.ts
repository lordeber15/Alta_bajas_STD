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
// Reutilizamos el tipo de payload definido en el mock para consistencia
type CreateSolicitudPayload = mockBackend.CreateSolicitudPayload;


/**
 * IMPLEMENTACIONES REALES
 * Conecta con el servidor Node.js + Sequelize
 */
const realApi = {
    getCurrentUser: async (): Promise<Usuario> => {
        // En un escenario real, esto vendría de un token de sesión
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
        return mockBackend.getSistemasAlta();
    },

    createSolicitudAlta: async (payload: CreateSolicitudPayload): Promise<SolicitudConSistemas> => {
        return mockBackend.createSolicitudAlta(payload);
    },

    getSolicitudesPendientesAlta: async (): Promise<SolicitudConSistemas[]> => {
        return mockBackend.getSolicitudesPendientesAlta();
    },

    cambiarEstadoSolicitud: async (id: string, nuevoEstado: EstadoSolicitud): Promise<SolicitudConSistemas> => {
        return mockBackend.cambiarEstadoSolicitud(id, nuevoEstado);
    },

    marcarSistemaCompletado: async (solicitudId: string, sistemaId: string): Promise<SolicitudConSistemas> => {
        return mockBackend.marcarSistemaCompletado(solicitudId, sistemaId);
    },

    getMisSolicitudes: async (userId: string): Promise<SolicitudConSistemas[]> => {
        return mockBackend.getMisSolicitudes(userId);
    },

    getSolicitudById: async (id: string): Promise<SolicitudConSistemas | undefined> => {
        return mockBackend.getSolicitudById(id);
    },

    updateSolicitud: async (id: string, payload: mockBackend.UpdateSolicitudPayload): Promise<SolicitudConSistemas> => {
        return mockBackend.updateSolicitud(id, payload);
    },

    getSolicitudesParaValidar: async (): Promise<SolicitudConSistemas[]> => {
        return mockBackend.getSolicitudesParaValidar();
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
            id: u.tbl_persona?.id_persona?.toString() || '0',
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
            sistemas: [] // Se cargará dinámicamente si es necesario
        }));
    },

    aprobarSolicitud: async (id: string): Promise<SolicitudConSistemas> => {
        return mockBackend.aprobarSolicitud(id);
    },

    rechazarSolicitud: async (id: string, motivo: string): Promise<SolicitudConSistemas> => {
        return mockBackend.rechazarSolicitud(id, motivo);
    },

    // Bajas
    createSolicitudBaja: async (userId: string, sistemasIds: string[]): Promise<SolicitudConSistemas> => {
        return mockBackend.createSolicitudBaja(userId, sistemasIds);
    },

    getSolicitudesPendientesBaja: async (): Promise<SolicitudConSistemas[]> => {
        return mockBackend.getSolicitudesPendientesBaja();
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

