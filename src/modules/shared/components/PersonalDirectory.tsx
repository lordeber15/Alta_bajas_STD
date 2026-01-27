import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import type { Usuario } from '../types/models';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface PersonalDirectoryProps {
    renderAction?: (user: Usuario) => React.ReactNode;
    actionLabel?: string;
    onAction?: (user: Usuario) => void;
    onGenerarAlta?: (user: Usuario) => void;
    onModificar?: (user: Usuario) => void;
    showExport?: boolean;
}

/**
 * Directorio de Personal
 * Muestra la lista de usuarios con su código, nombre, estado y área.
 * Permite acciones dinámicas como Dar de Baja o Generar Alta.
 */
export const PersonalDirectory: React.FC<PersonalDirectoryProps> = ({
    renderAction,
    actionLabel,
    onAction,
    onGenerarAlta,
    onModificar,
    showExport = false
}) => {
    const [personal, setPersonal] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(false);
    const [allAreas, setAllAreas] = useState<any[]>([]);

    // Estado para Paginación, Ordenamiento y Filtrado
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Usuario; direction: 'asc' | 'desc' } | null>(null);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVO' | 'INACTIVO'>('ALL');
    const [filterArea, setFilterArea] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState<string>('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [personalData, areasData] = await Promise.all([
                api.getPersonal(),
                api.getOficinas() // Usamos getOficinas que ahora trae áreas reales
            ]);
            setPersonal(personalData);
            setAllAreas(areasData);
        } catch (e) {
            console.error(e);
            toast.error('Error al cargar directorio de personal');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- Lógica de Procesamiento de Datos ---

    // 1. Filtrado (Estado + Área + Nombre)
    const filteredData = personal.filter(u => {
        const matchesStatus = filterStatus === 'ALL' || u.estado === filterStatus;
        const matchesArea = filterArea === 'ALL' || u.areaName === filterArea;
        const matchesSearch = u.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesArea && matchesSearch;
    });

    // 2. Ordenamiento
    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aVal = a[key] as any;
        let bVal = b[key] as any;

        // Manejo de valores nulos o indefinidos
        if (aVal === undefined || aVal === null) aVal = '';
        if (bVal === undefined || bVal === null) bVal = '';

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    // 3. Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    const handleSort = (key: keyof Usuario) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1); // Volver a la primera página si cambia el orden
    };

    /**
     * Exporta la tabla filtrada y ordenada a un archivo Excel (.xlsx)
     */
    const handleExport = () => {
        const dataToExport = sortedData.map(u => ({
            'Código': u.id_usuario,
            'Nombre': u.nombre,
            'Estado': u.estado,
            'Área': u.areaName
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Personal');
        XLSX.writeFile(workbook, 'Directorio_Personal.xlsx');
        toast.success('Directorio exportado correctamente');
    };

    const SortIcon = ({ column }: { column: keyof Usuario }) => {
        if (sortConfig?.key !== column) return <span className="ml-1 text-gray-300 opacity-0 group-hover:opacity-100 italic">↕</span>;
        return <span className="ml-1 text-blue-600 font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    if (loading) return <div className="text-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Cargando directorio de personal...</p>
    </div>;

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Buscador por Nombre */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Buscar por Nombre</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            <input
                                type="text"
                                placeholder="Nombre del usuario..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Filtro por Estado */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Estado</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value as any); setCurrentPage(1); }}
                            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="ALL">Todos los Estados</option>
                            <option value="ACTIVO">Activos</option>
                            <option value="INACTIVO">Inactivos</option>
                        </select>
                    </div>

                    {/* Filtro por Área */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Filtro por Área</label>
                        <select
                            value={filterArea}
                            onChange={(e) => { setFilterArea(e.target.value); setCurrentPage(1); }}
                            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="ALL">Todas las Áreas</option>
                            {allAreas.map(a => (
                                <option key={a.id} value={a.nombre}>{a.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Exportación */}
                    <div className="flex flex-col gap-1.5 justify-end">
                        {showExport && (
                            <button
                                onClick={handleExport}
                                className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                Exportar Reporte
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left table-fixed">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th
                                    onClick={() => handleSort('id_usuario')}
                                    className="w-24 px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center">Código <SortIcon column="id_usuario" /></div>
                                </th>
                                <th
                                    onClick={() => handleSort('nombre')}
                                    className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center">Nombre <SortIcon column="nombre" /></div>
                                </th>
                                <th
                                    className="w-32 px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider"
                                >
                                    Estado
                                </th>
                                <th
                                    onClick={() => handleSort('areaName')}
                                    className="w-1/4 px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center">Área <SortIcon column="areaName" /></div>
                                </th>
                                <th className="w-40 px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentItems.map(user => {
                                const isActive = user.id_estado === 8;
                                return (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{user.id_usuario}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 truncate" title={user.nombre}>{user.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`
                                                px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border
                                                ${isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}
                                            `}>
                                                {isActive ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 break-words line-clamp-2" title={user.areaName}>
                                            {user.areaName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {renderAction ? renderAction(user) : (
                                                isActive ? (
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => onModificar?.(user)}
                                                            className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-bold transition-all border border-blue-100 text-xs"
                                                        >
                                                            Modificar Sistemas
                                                        </button>
                                                        <button
                                                            onClick={() => onAction?.(user)}
                                                            className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg font-bold transition-all border border-red-100 text-xs"
                                                        >
                                                            {actionLabel || 'Dar de Baja'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => onGenerarAlta?.(user)}
                                                        className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-bold transition-all border border-blue-100"
                                                    >
                                                        Generar Alta
                                                    </button>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Controles de Paginación */}
                {totalPages > 1 && (
                    <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Mostrando <span className="font-semibold">{indexOfFirstItem + 1}</span> a <span className="font-semibold">{Math.min(indexOfLastItem, sortedData.length)}</span> de <span className="font-semibold">{sortedData.length}</span> resultados
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Anterior
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
