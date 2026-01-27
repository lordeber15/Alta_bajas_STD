import React, { useEffect, useState } from 'react';
import { api } from '../shared/api/api';
import { toast } from 'sonner';

interface SistemaBase {
    id_sistema: number;
    nombre: string;
    codigo: string;
    aplica_alta: boolean;
    aplica_baja: boolean;
    requiere_detalle: boolean;
    estado: number;
}

export const JefeSistemas: React.FC = () => {
    const [sistemas, setSistemas] = useState<SistemaBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        aplica_alta: true,
        aplica_baja: true,
        requiere_detalle: false
    });

    const loadSistemas = async () => {
        try {
            const data = await api.getSistemasBase();
            setSistemas(data);
        } catch (error) {
            toast.error('Error al cargar sistemas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSistemas();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.updateSistema(editingId.toString(), formData);
                toast.success('Sistema actualizado');
            } else {
                await api.createSistema(formData);
                toast.success('Sistema creado');
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ nombre: '', codigo: '', aplica_alta: true, aplica_baja: true, requiere_detalle: false });
            loadSistemas();
        } catch (error) {
            toast.error('Error al guardar sistema');
        }
    };

    const handleEdit = (s: SistemaBase) => {
        setEditingId(s.id_sistema);
        setFormData({
            nombre: s.nombre,
            codigo: s.codigo,
            aplica_alta: !!s.aplica_alta,
            aplica_baja: !!s.aplica_baja,
            requiere_detalle: !!s.requiere_detalle
        });
        setShowForm(true);
    };

    const toggleEstado = async (s: SistemaBase) => {
        try {
            await api.updateSistema(s.id_sistema.toString(), { estado: s.estado === 1 ? 0 : 1 });
            toast.info(`Sistema ${s.estado === 1 ? 'desactivado' : 'activado'}`);
            loadSistemas();
        } catch (error) {
            toast.error('Error al cambiar estado');
        }
    };

    if (loading) return <div className="text-center py-12 text-gray-500 animate-pulse">Cargando catálogo...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Catálogo de Sistemas</h3>
                    <p className="text-sm text-gray-500">Administre los recursos disponibles para Altas y Bajas</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => { setShowForm(true); setEditingId(null); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Nuevo Sistema
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 animate-slideDown">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nombre del Sistema</label>
                            <input
                                type="text"
                                required
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ej: Correo Institucional"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Código Único</label>
                            <input
                                type="text"
                                required
                                value={formData.codigo}
                                onChange={e => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                                className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ej: CORREO"
                            />
                        </div>
                        <div className="md:col-span-2 flex flex-wrap gap-4 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200">
                                <input type="checkbox" checked={formData.aplica_alta} onChange={e => setFormData({ ...formData, aplica_alta: e.target.checked })} />
                                <span className="text-sm font-medium text-gray-700">Aplica para Altas</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200">
                                <input type="checkbox" checked={formData.aplica_baja} onChange={e => setFormData({ ...formData, aplica_baja: e.target.checked })} />
                                <span className="text-sm font-medium text-gray-700">Aplica para Bajas</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200">
                                <input type="checkbox" checked={formData.requiere_detalle} onChange={e => setFormData({ ...formData, requiere_detalle: e.target.checked })} />
                                <span className="text-sm font-medium text-gray-700">Requiere Detalle (Input de texto)</span>
                            </label>
                        </div>
                        <div className="md:col-span-2 flex gap-2 pt-2 border-t border-gray-200 mt-2 transition-all">
                            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md">
                                {editingId ? 'Actualizar' : 'Guardar'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-300">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Sistema</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Código</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Aplica</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sistemas.map(s => (
                            <tr key={s.id_sistema} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-800">{s.nombre}</div>
                                    {s.requiere_detalle && <span className="text-[10px] bg-purple-50 text-purple-600 px-1 rounded font-bold uppercase">Requiere Detalle</span>}
                                </td>
                                <td className="px-6 py-4 text-sm font-mono text-gray-500">{s.codigo}</td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2">
                                        {s.aplica_alta && <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-bold">ALTA</span>}
                                        {s.aplica_baja && <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[10px] font-bold">BAJA</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.estado === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {s.estado === 1 ? 'ACTIVO' : 'INACTIVO'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => toggleEstado(s)} className={`p-2 rounded-lg ${s.estado === 1 ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`} title={s.estado === 1 ? 'Desactivar' : 'Activar'}>
                                            {s.estado === 1 ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
