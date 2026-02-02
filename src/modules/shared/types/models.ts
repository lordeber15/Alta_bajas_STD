/**
 * Definición de tipos y modelos del dominio para el módulo de Altas y Bajas.
 * Estos tipos deben coincidir con la estructura de datos que manejará el backend real.
 */

// Roles de usuario en el sistema
export type RolUsuario = 'OGA' | 'ETIC' | 'JEFE_ETIC';

// Estados posibles de una solicitud
export type EstadoSolicitud =
    | 'PENDIENTE_ALTA'
    | 'EN_PROCESO_ALTA'
    | 'PARA_VALIDAR_ALTA'
    | 'COMPLETADO_ALTA'
    | 'PENDIENTE_BAJA'
    | 'EN_PROCESO_BAJA'
    | 'PARA_VALIDAR_BAJA'
    | 'COMPLETADO_BAJA'
    | 'OBSERVADO';

// Tipo de solicitud
export type TipoSolicitud = 'ALTA' | 'BAJA';

// Modelo de Usuario
export interface Usuario {
    id: string; // id_persona
    id_usuario: number; // id_usuario de la tabla tbl_usuario
    nombre: string;
    documento?: string; // documento de tbl_persona
    cargo?: string; // cargo de tbl_persona
    correo?: string;
    rol: RolUsuario;
    estado: 'ACTIVO' | 'INACTIVO';
    id_estado?: number; // 8: Activo, 9: Inactivo
    areaName?: string; // Nombre del área desde tbl_area
    oficinaId?: string; // Opcional, solo si el usuario pertenece a una oficina específica
    sistemas: string[]; // IDs de sistemas activos para este usuario
}

// Modelo de Oficina
export interface Oficina {
    id: string;
    nombre: string;
}

// Modelo de Sistema (recursos a los que se puede dar alta/baja)
export interface Sistema {
    id: string;
    nombre: string;
    codigo: string; // Identificador único textual, ej: 'CORREO', 'SIGEIN'
    aplicaAlta: boolean;
    aplicaBaja: boolean;
    requiereDetalle: boolean; // Si true, la solicitud debe especificar detalle (ej. carpetas compartidas)
    estado: 'ACTIVO' | 'INACTIVO';
}

// Detalle de un sistema dentro de una solicitud
export interface SolicitudSistema {
    id: string;
    solicitudId: string;
    sistemaId: string;
    sistemaNombre?: string;
    requerido: boolean;
    detalle?: string; // Información extra si requiereDetalle es true
    estadoAtencion: 'PENDIENTE' | 'COMPLETADO';
    observacion?: string; // Observaciones del técnico que atiende
}

// Solicitud base
export interface Solicitud {
    id: string;
    tipo: TipoSolicitud;
    // Datos del usuario objetivo (a quien se le da el alta/baja)
    usuarioObjetivoNombre: string;
    usuarioObjetivoDniRuc: string;
    cargo: string;
    oficinaId: string;
    oficinaNombre?: string;

    estado: EstadoSolicitud;
    creadoPorId: string;
    motivo?: string;
    fechaCreacion: string; // ISO String
}

// Solicitud completa con sus sistemas asociados
export interface SolicitudConSistemas extends Solicitud {
    sistemas: SolicitudSistema[];
}
