import React from 'react';
import { PersonaDirectorio } from '../../directorio/PersonaDirectorio';

/**
 * Vista de Directorio de Personal para Jefatura.
 * Utiliza el componente común PersonaDirectorio con la opción de exportar datos.
 */
export const PersonalList: React.FC = () => {
    return (
        <div className="animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Directorio de Usuarios Registrados</h2>
            <PersonaDirectorio showExport={true} />
        </div>
    );
};
