import React from 'react';
import { PersonalDirectory } from './PersonalDirectory';

/**
 * Vista de Directorio de Personal para Jefatura.
 * Utiliza el componente común PersonalDirectory con la opción de exportar datos.
 */
export const PersonalList: React.FC = () => {
    return (
        <div className="animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Directorio de Usuarios Registrados</h2>
            <PersonalDirectory showExport={true} />
        </div>
    );
};
