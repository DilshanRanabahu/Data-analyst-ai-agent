import React, { useState, useEffect } from 'react';
import { X, Database, Table as TableIcon, Columns, Key, FileType } from 'lucide-react';
import toast from 'react-hot-toast';

const SchemaVisualizer = ({ isOpen, onClose, database }) => {
    const [schema, setSchema] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTable, setSelectedTable] = useState(null);

    useEffect(() => {
        if (isOpen && database?.id) {
            fetchSchema(database.id);
        } else {
            setSchema(null);
            setSelectedTable(null);
        }
    }, [isOpen, database]);

    const fetchSchema = async (connectionId) => {
        setLoading(true);
        try {
            const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://54.198.22.75:5000';
            const response = await fetch(`${PYTHON_API_URL}/api/sql/schema/${connectionId}`);
            const data = await response.json();

            if (data.success && data.schema) {
                setSchema(data.schema);
                // Select first table by default
                const tables = Object.keys(data.schema);
                if (tables.length > 0) {
                    setSelectedTable(tables[0]);
                }
            } else {
                toast.error('We could not load the database details right now. Please try again.');
            }
        } catch (error) {
            console.error('Error fetching schema:', error);
            toast.error('We had trouble connecting to your database. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const tables = schema ? Object.keys(schema) : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shadow-sm">
                            <Database className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                Schema Explorer
                                <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                                    {database?.name}
                                </span>
                            </h2>
                            <p className="text-sm text-gray-500 font-medium capitalize">
                                {database?.type} Database • {tables.length} Tables
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden bg-slate-50">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-medium">Analyzing database structure...</p>
                        </div>
                    ) : !schema || tables.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <Database className="w-16 h-16 text-gray-300 mb-4" />
                            <p className="text-lg font-medium text-gray-600">No tables found</p>
                            <p className="text-sm">This database appears to be empty.</p>
                        </div>
                    ) : (
                        <>
                            {/* Tables Sidebar */}
                            <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50 sticky top-0">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        <TableIcon className="w-4 h-4" /> Tables
                                    </h3>
                                </div>
                                <div className="p-2 space-y-1">
                                    {tables.map(tableName => (
                                        <button
                                            key={tableName}
                                            onClick={() => setSelectedTable(tableName)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                                                selectedTable === tableName
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                                            }`}
                                        >
                                            <TableIcon className={`w-4 h-4 ${selectedTable === tableName ? 'text-emerald-500' : 'text-gray-400'}`} />
                                            <span className="truncate">{tableName}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Columns View */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {selectedTable && schema[selectedTable] && (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                <Columns className="w-5 h-5 text-blue-500" />
                                                {selectedTable}
                                            </h3>
                                            <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                                {schema[selectedTable].length} Columns
                                            </span>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {schema[selectedTable].map((column, idx) => (
                                                <div key={idx} className="flex items-center px-6 py-4 hover:bg-slate-50 transition-colors">
                                                    <div className="w-1/3 flex items-center gap-3">
                                                        <span className="font-semibold text-gray-800">{column.name}</span>
                                                    </div>
                                                    <div className="w-1/3 flex items-center gap-2">
                                                        <FileType className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                            {column.type.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchemaVisualizer;
