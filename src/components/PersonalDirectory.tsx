import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import type { Usuario } from '../types/models';

interface PersonalDirectoryProps {
    renderAction?: (user: Usuario) => React.ReactNode;
}

export const PersonalDirectory: React.FC<PersonalDirectoryProps> = ({ renderAction }) => {
    const [personal, setPersonal] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await api.getPersonal();
                setPersonal(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="text-center p-8">Cargando personal...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oficina</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        {renderAction && <th className="px-6 py-3 text-right">Acciones</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {personal.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.nombre}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.correo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.rol}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.oficinaId}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {user.estado}
                                </span>
                            </td>
                            {renderAction && (
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {renderAction(user)}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
