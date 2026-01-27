import React, { useEffect, useState } from 'react';
import { api } from '../shared/api/api';
import type { Usuario, SolicitudConSistemas } from '../shared/types/models';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { toast } from 'sonner';

export const JefeResumen: React.FC = () => {
    const [personal, setPersonal] = useState<Usuario[]>([]);
    const [solicitudesVal, setSolicitudesVal] = useState<SolicitudConSistemas[]>([]);
    const [solicitudesBaja, setSolicitudesBaja] = useState<SolicitudConSistemas[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const [personalData, solData, bajaData] = await Promise.all([
                api.getPersonal(),
                api.getSolicitudesParaValidar(),
                api.getSolicitudesPendientesBaja()
            ]);
            setPersonal(personalData);
            setSolicitudesVal(solData);
            setSolicitudesBaja(bajaData);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar datos del resumen');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) return <div className="text-center py-12 animate-pulse text-gray-500">Calculando estadísticas...</div>;

    // --- Cálculo de KPIs ---
    const totalActivos = personal.filter(u => u.id_estado === 8).length;
    const totalInactivos = personal.filter(u => u.id_estado === 9).length;

    // Validaciones: Altas vs Bajas
    const valAltas = solicitudesVal.filter(s => s.tipo === 'ALTA').length;
    const valBajas = solicitudesVal.filter(s => s.tipo === 'BAJA').length;
    const penValidacion = solicitudesVal.length;

    // Bajas: Pendientes vs En Proceso
    const bajasPendientesInit = solicitudesBaja.filter(s => s.estado === 'PENDIENTE_BAJA').length;
    const bajasEnProceso = solicitudesBaja.filter(s => s.estado === 'EN_PROCESO_BAJA').length;
    const penBaja = solicitudesBaja.length;

    // --- Datos para Gráfico de Distribución por Área ---
    const areaCounts: Record<string, number> = {};
    personal.forEach(u => {
        const area = u.areaName || 'Sin Área';
        areaCounts[area] = (areaCounts[area] || 0) + 1;
    });
    const areaData = Object.keys(areaCounts).map(name => ({
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        cantidad: areaCounts[name]
    })).sort((a, b) => b.cantidad - a.cantidad);

    // --- Datos para Gráfico de Estados ---
    const statusData = [
        { name: 'Activos', value: totalActivos, color: '#10b981' }, // Emerald 500
        { name: 'Inactivos', value: totalInactivos, color: '#ef4444' } // Red 500
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Usuarios Activos</p>
                        <h3 className="text-2xl font-black text-gray-900">{totalActivos}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="p-4 bg-yellow-50 text-yellow-600 rounded-xl">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Por Validar (Jefe)</p>
                        <h3 className="text-2xl font-black text-gray-900">{penValidacion}</h3>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-bold">A: {valAltas}</span>
                            <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md font-bold">B: {valBajas}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bajas Pendientes</p>
                        <h3 className="text-2xl font-black text-gray-900">{penBaja}</h3>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md font-bold">P: {bajasPendientesInit}</span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md font-bold">EP: {bajasEnProceso}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Usuarios Inactivos</p>
                        <h3 className="text-2xl font-black text-gray-900">{totalInactivos}</h3>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart Area Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        Distribución de Personal por Área
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={areaData} layout="vertical" margin={{ left: 20, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '12px', fontWeight: '500' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="cantidad" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart Status */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-teal-500 rounded-full"></span>
                        Estado de Usuarios General
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
