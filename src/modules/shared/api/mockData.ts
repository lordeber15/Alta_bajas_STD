import type { Usuario, Oficina, Sistema, SolicitudConSistemas } from '../types/models';

/**
 * DATOS DE PRUEBA (MOCK DATA)
 * ---------------------------
 * Estos datos residen en memoria y simulan el estado inicial de la base de datos.
 * Se utilizan únicamente cuando el flag USE_MOCK en api.ts es true.
 */

export const mockUsuarios: Usuario[] = [
    {
        id: 'u1',
        id_usuario: 1,
        nombre: 'Juan Pérez (OGA)',
        correo: 'juan.oga@empresa.com',
        rol: 'OGA',
        estado: 'ACTIVO',
        oficinaId: 'o1',
        sistemas: []
    },
    {
        id: 'u2',
        id_usuario: 2,
        nombre: 'Maria Gomez (ETIC)',
        correo: 'maria.etic@empresa.com',
        rol: 'ETIC',
        estado: 'ACTIVO',
        oficinaId: 'o2',
        sistemas: []
    },
    {
        id: 'u3',
        id_usuario: 3,
        nombre: 'Carlos Jefe (JEFE_ETIC)',
        correo: 'carlos.jefe@empresa.com',
        rol: 'JEFE_ETIC',
        estado: 'ACTIVO',
        oficinaId: 'o2',
        sistemas: []
    },
];

export const mockOficinas: Oficina[] = [
    { id: 'o1', nombre: 'Oficina de Gestión Administrativa (OGA)' },
    { id: 'o2', nombre: 'Área Operativa de TI (ETIC)' },
    { id: 'o3', nombre: 'Recursos Humanos' },
];

export const mockSistemas: Sistema[] = [
    {
        id: 's1',
        nombre: 'Sistema de Trámite Documentario',
        codigo: 'STD',
        aplicaAlta: true,
        aplicaBaja: true,
        requiereDetalle: false,
        estado: 'ACTIVO',
    },
    {
        id: 's2',
        nombre: 'Sistema de Gestión Integrada (SIGEIN)',
        codigo: 'SIGEIN',
        aplicaAlta: true,
        aplicaBaja: true,
        requiereDetalle: false,
        estado: 'ACTIVO',
    },
    {
        id: 's3',
        nombre: 'Correo Institucional',
        codigo: 'CORREO',
        aplicaAlta: true,
        aplicaBaja: true,
        requiereDetalle: false,
        estado: 'ACTIVO',
    },
    {
        id: 's4',
        nombre: 'Equipo de Cómputo (PC/Laptop)',
        codigo: 'PC',
        aplicaAlta: true,
        aplicaBaja: true,
        requiereDetalle: false,
        estado: 'ACTIVO',
    },
    {
        id: 's5',
        nombre: 'Carpetas Compartidas',
        codigo: 'CARPETA_COMPARTIDA',
        aplicaAlta: true,
        aplicaBaja: true,
        requiereDetalle: true, // Requiere especificar rutas o nombres de carpetas
        estado: 'ACTIVO',
    },
];

// Array mutable para almacenar las solicitudes creadas durante la sesión
export const mockSolicitudes: SolicitudConSistemas[] = [];
