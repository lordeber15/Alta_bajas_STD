import type {
    Usuario,
    Oficina,
    Sistema,
    SolicitudConSistemas,
    EstadoSolicitud,
    SolicitudSistema
} from '../types/models';
import { mockUsuarios, mockOficinas, mockSistemas, mockSolicitudes } from './mockData';

/**
 * BACKEND SIMULADO
 * ----------------
 * Este archivo contiene funciones que simulan la lógica de negocio que normalmente
 * residiría en el servidor (PHP/MySQL). 
 * 
 * Cada función retorna una Promesa para simular la asincronía de una petición de red.
 */

// Simula un retardo de red aleatorio
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simula obtener el usuario autenticado (actualmente hardcodeado a un usuario OGA por defecto, o cambiable aquí)
export const getCurrentUser = async (): Promise<Usuario> => {
    await delay(300);
    // Por defecto retornamos el usuario OGA para pruebas de creación
    // Cambiar índice a 1 para probar como ETIC
    // Nota: En una app real, esto vendría de la sesión / token
    return mockUsuarios[0];
};

export const getOficinas = async (): Promise<Oficina[]> => {
    await delay(300);
    return [...mockOficinas];
};

export const getSistemasAlta = async (): Promise<Sistema[]> => {
    await delay(300);
    // Filtra sistemas activos que aplican para Alta
    return mockSistemas.filter(s => s.estado === 'ACTIVO' && s.aplicaAlta);
};

export const getSistemasBaja = async (): Promise<Sistema[]> => {
    await delay(300);
    // Filtra sistemas activos que aplican para Baja
    return mockSistemas.filter(s => s.estado === 'ACTIVO' && s.aplicaBaja);
};

// Payload esperado para crear una solicitud (sin ID ni fecha)
export type CreateSolicitudPayload = Omit<SolicitudConSistemas, 'id' | 'fechaCreacion' | 'sistemas'> & {
    sistemas: Omit<SolicitudSistema, 'id' | 'solicitudId'>[]
};

export const createSolicitudAlta = async (payload: CreateSolicitudPayload): Promise<SolicitudConSistemas> => {
    await delay(500);

    const newId = `sol-${Date.now()}`;
    const now = new Date().toISOString();

    // Mapeamos los sistemas para agregarles IDs generados
    const sistemasConIds: SolicitudSistema[] = payload.sistemas.map((sis, index) => ({
        ...sis,
        id: `solsis-${Date.now()}-${index}`,
        solicitudId: newId
    }));

    const nuevaSolicitud: SolicitudConSistemas = {
        ...payload,
        id: newId,
        fechaCreacion: now,
        sistemas: sistemasConIds
    };

    mockSolicitudes.push(nuevaSolicitud);
    console.log('[MOCK BACKEND] Solicitud creada:', nuevaSolicitud);

    return nuevaSolicitud;
};

export const getSolicitudesPendientesAlta = async (): Promise<SolicitudConSistemas[]> => {
    await delay(400);
    // Filtra solicitudes de tipo ALTA que estén PENDIENTE o EN_PROCESO (para que ETIC las vea)
    // Ajustar lógica según requerimiento exacto. Aquí traemos las que ETIC debe ver.
    return mockSolicitudes.filter(s =>
        s.tipo === 'ALTA' &&
        (s.estado === 'PENDIENTE_ALTA' || s.estado === 'EN_PROCESO_ALTA')
    );
};

export const cambiarEstadoSolicitud = async (id: string, nuevoEstado: EstadoSolicitud): Promise<SolicitudConSistemas> => {
    await delay(300);
    const solicitud = mockSolicitudes.find(s => s.id === id);
    if (!solicitud) {
        throw new Error(`Solicitud con id ${id} no encontrada`);
    }

    solicitud.estado = nuevoEstado;
    console.log(`[MOCK BACKEND] Estado de solicitud ${id} cambiado a ${nuevoEstado}`);
    return { ...solicitud }; // Retorna copia
};

export const marcarSistemaCompletado = async (solicitudId: string, sistemaId: string, estado: 'PENDIENTE' | 'COMPLETADO' = 'COMPLETADO'): Promise<SolicitudConSistemas> => {
    await delay(300);
    const solicitud = mockSolicitudes.find(s => s.id === solicitudId);
    if (!solicitud) {
        throw new Error('Solicitud no encontrada');
    }

    const sistema = solicitud.sistemas.find(s => s.sistemaId === sistemaId);
    if (!sistema) {
        throw new Error('Sistema no encontrado en la solicitud');
    }

    sistema.estadoAtencion = estado;
    console.log(`[MOCK BACKEND] Sistema ${sistemaId} marcado como ${estado} en solicitud ${solicitudId}`);

    return { ...solicitud };
};

// --- Nuevas funciones para OGA Edit & List ---

export const getMisSolicitudes = async (userId: string): Promise<SolicitudConSistemas[]> => {
    await delay(300);
    // Retorna las solicitudes creadas por el usuario especificado
    return mockSolicitudes.filter(s => s.creadoPorId === userId);
};

export const getSolicitudById = async (id: string): Promise<SolicitudConSistemas | undefined> => {
    await delay(200);
    return mockSolicitudes.find(s => s.id === id);
}

// Payload parcial para actualizar
export type UpdateSolicitudPayload = Partial<Omit<SolicitudConSistemas, 'id' | 'fechaCreacion' | 'creadoPorId' | 'sistemas'>> & {
    sistemas?: SolicitudSistema[] // Reemplazo completo de sistemas o lógica de merge custom
};


export const updateSolicitud = async (id: string, payload: UpdateSolicitudPayload): Promise<SolicitudConSistemas> => {
    await delay(400);
    const index = mockSolicitudes.findIndex(s => s.id === id);
    if (index === -1) {
        throw new Error('Solicitud no encontrada');
    }

    const solicitud = mockSolicitudes[index];

    // Validación simple: Solo permitir editar si está pendiente
    // if (solicitud.estado !== 'PENDIENTE_ALTA' && solicitud.estado !== 'PENDIENTE_BAJA') {
    //    throw new Error('No se puede editar una solicitud que ya no está pendiente');
    // }

    // Actualizamos campos de primer nivel
    const updatedSolicitud = {
        ...solicitud,
        ...payload,
        sistemas: payload.sistemas ? payload.sistemas : solicitud.sistemas
    };

    // Si vienen sistemas nuevos, asegurar que tengan el ID de solicitud correcto
    if (payload.sistemas) {
        updatedSolicitud.sistemas = payload.sistemas.map(s => ({
            ...s,
            solicitudId: id,
            id: s.id || `solsis-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` // ID si es nuevo
        }));
    }

    mockSolicitudes[index] = updatedSolicitud;
    console.log(`[MOCK BACKEND] Solicitud ${id} actualizada:`, updatedSolicitud);
    return updatedSolicitud;
};

// --- Funciones para Jefatura y Validación ---

export const getSolicitudesParaValidar = async (): Promise<SolicitudConSistemas[]> => {
    await delay(300);
    return mockSolicitudes.filter(s => s.estado === 'PARA_VALIDAR_ALTA' || s.estado === 'PARA_VALIDAR_BAJA');
};

export const getPersonal = async (): Promise<Usuario[]> => {
    await delay(400);
    return mockUsuarios;
};

// Aprobar solicitud (Jefe) -> Crea usuario final y marca completado
export const aprobarSolicitud = async (id: string): Promise<SolicitudConSistemas> => {
    await delay(500);
    const index = mockSolicitudes.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Solicitud no encontrada');

    const solicitud = mockSolicitudes[index];

    // Si es ALTA
    if (solicitud.tipo === 'ALTA') {
        solicitud.estado = 'COMPLETADO_ALTA' as any;

        // Crear usuario real
        const nuevoUsuario: Usuario = {
            id: `u-${Date.now()}`,
            id_usuario: Math.floor(Math.random() * 1000),
            nombre: solicitud.usuarioObjetivoNombre,
            correo: `${solicitud.usuarioObjetivoNombre.split(' ')[0].toLowerCase()}@empresa.com`,
            rol: 'ETIC',
            estado: 'ACTIVO',
            oficinaId: solicitud.oficinaId,
            // Guardar sistemas aprobados
            sistemas: solicitud.sistemas.map(s => s.sistemaId)
        };
        mockUsuarios.push(nuevoUsuario);
        console.log('[MOCK BACKEND] Usuario creado:', nuevoUsuario);

    } else if (solicitud.tipo === 'BAJA') {
        solicitud.estado = 'COMPLETADO_BAJA' as any;

        // Buscar usuario y desactivarlo
        // En un caso real buscaríamos por DNI, aquí asumimos que el nombre coincide o tenemos ID si lo guardáramos
        // Para simplificar el mock, buscamos por nombre exacto
        const userIndex = mockUsuarios.findIndex(u => u.nombre === solicitud.usuarioObjetivoNombre);
        if (userIndex !== -1) {
            mockUsuarios[userIndex].estado = 'INACTIVO';
            // Opcional: limpiar sistemas
            mockUsuarios[userIndex].sistemas = [];
            console.log('[MOCK BACKEND] Usuario desactivado:', mockUsuarios[userIndex]);
        }
    }

    return { ...solicitud };
};

export const createSolicitudBaja = async (userId: string, sistemasIds: string[]): Promise<SolicitudConSistemas> => {
    await delay(500);
    const user = mockUsuarios.find(u => u.id === userId);
    if (!user) throw new Error('Usuario no encontrado');

    const newId = `sol-baja-${Date.now()}`;
    const now = new Date().toISOString();

    // Crear solicitud con los sistemas seleccionados
    const nuevaSolicitud: SolicitudConSistemas = {
        id: newId,
        tipo: 'BAJA',
        usuarioObjetivoNombre: user.nombre,
        usuarioObjetivoDniRuc: 'DNI-MOCK-' + user.id, // Simplificado
        cargo: 'Cargo Actual', // Debería venir del user
        oficinaId: user.oficinaId || 'OF-GEN',
        estado: 'PENDIENTE_BAJA',
        creadoPorId: 'oga-user', // hardcoded current user
        fechaCreacion: now,
        sistemas: sistemasIds.map(sisId => ({
            id: `solsis-${Date.now()}-${sisId}`,
            solicitudId: newId,
            sistemaId: sisId,
            requerido: true,
            estadoAtencion: 'PENDIENTE'
        }))
    };

    mockSolicitudes.push(nuevaSolicitud);
    console.log('[MOCK BACKEND] Solicitud Baja creada:', nuevaSolicitud);
    return nuevaSolicitud;
};

export const rechazarSolicitud = async (id: string, motivo: string): Promise<SolicitudConSistemas> => {
    await delay(300);
    const index = mockSolicitudes.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Solicitud no encontrada');

    const solicitud = mockSolicitudes[index];
    solicitud.estado = 'OBSERVADO' as any;
    solicitud.motivo = motivo;

    return { ...solicitud };
};

export const getSolicitudesPendientesBaja = async (): Promise<SolicitudConSistemas[]> => {
    await delay(400);
    // Filtrar para ETIC
    return mockSolicitudes.filter(s =>
        s.tipo === 'BAJA' &&
        (s.estado === 'PENDIENTE_BAJA' || s.estado === 'EN_PROCESO_BAJA')
    );
};

