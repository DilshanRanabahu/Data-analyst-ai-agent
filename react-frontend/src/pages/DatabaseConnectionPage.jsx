import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const DatabaseConnectionPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        dbType: 'mysql',
        host: 'localhost',
        port: 3306,
        database: '',
        username: '',
        password: ''
    });
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Auto-update port when database type changes
            ...(name === 'dbType' && {
                port: value === 'mysql' ? 3306 : 5432
            })
        }));
    };

    const handleTestConnection = async () => {
        setTesting(true);
        try {
            const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5000';
            const response = await fetch(`${PYTHON_API_URL}/api/sql/test-connection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dbType: formData.dbType,
                    host: formData.host,
                    port: parseInt(formData.port),
                    database: formData.database,
                    username: formData.username,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Connection successful!');
                setConnectionStatus('success');
            } else {
                toast.error('We could not connect to your database. Please check the details and try again.');
                setConnectionStatus('error');
            }
        } catch (error) {
            console.error('Error testing connection:', error);
            toast.error('We could not test the connection. Please make sure the database is running and accessible.');
            setConnectionStatus('error');
        } finally {
            setTesting(false);
        }
    };

    const handleSaveConnection = async () => {
        if (!formData.name || !formData.database || !formData.username) {
            toast.error('Please fill in all required fields (name, database, username)');
            return;
        }

        setSaving(true);
        try {
            const userId = localStorage.getItem('userId') || 'default_user';
            const connectionId = `conn_${Date.now()}`;

            // Save to Persistence Layer (Spring Backend -> Firestore)
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
            const response = await fetch(`${API_BASE_URL}/api/connections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: connectionId,
                    userId,
                    name: formData.name,
                    type: formData.dbType, // 'type' in model, 'dbType' in form
                    host: formData.host,
                    port: parseInt(formData.port),
                    database: formData.database,
                    username: formData.username,
                    password: formData.password || ''
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Database connected successfully!');
                navigate('/dashboard');
            } else {
                toast.error('We could not save your database connection. Please try again.');
            }
        } catch (error) {
            console.error('Error saving connection:', error);
            toast.error('There was a problem saving your connection. Please try again later.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40 flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center py-8">
                <div className="max-w-2xl w-full px-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-3xl">🗄️</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Connect Database</h1>
                            <p className="text-sm text-gray-600">Link MySQL or PostgreSQL for AI analysis</p>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <div className="space-y-5">
                            {/* Connection Name & Type - Side by side */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Connection Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Production DB"
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Database Type *
                                    </label>
                                    <select
                                        name="dbType"
                                        value={formData.dbType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
                                    >
                                        <option value="mysql">MySQL</option>
                                        <option value="postgresql">PostgreSQL</option>
                                    </select>
                                </div>
                            </div>

                            {/* Host and Port */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Host *
                                    </label>
                                    <input
                                        type="text"
                                        name="host"
                                        value={formData.host}
                                        onChange={handleChange}
                                        placeholder="localhost"
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Port *
                                    </label>
                                    <input
                                        type="number"
                                        name="port"
                                        value={formData.port}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Database Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Database Name *
                                </label>
                                <input
                                    type="text"
                                    name="database"
                                    value={formData.database}
                                    onChange={handleChange}
                                    placeholder="my_database"
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                                />
                            </div>

                            {/* Username & Password - Side by side */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Username *
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="db_user"
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Password <span className="text-gray-400 font-normal text-xs">(optional)</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-3">
                                <button
                                    onClick={handleTestConnection}
                                    disabled={testing}
                                    className="flex-1 px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                                >
                                    {testing ? 'Testing...' : 'Test Connection'}
                                </button>
                                <button
                                    onClick={handleSaveConnection}
                                    disabled={saving}
                                    className="flex-1 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all text-sm"
                                >
                                    {saving ? 'Saving...' : 'Save & Connect'}
                                </button>
                            </div>

                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseConnectionPage;
