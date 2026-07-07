import { useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import Navbar from '../components/Navbar';
import FileUpload from '../components/FileUpload';
import DatasetCard from '../components/DatasetCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Upload, Database, MessageSquare } from 'lucide-react';

const DashboardPage = () => {
    const { datasets, loading, fetchDatasets, deleteDataset } = useData();

    useEffect(() => {
        fetchDatasets();
    }, [fetchDatasets]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50/30">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">
                        Dashboard
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Upload and manage your data files for AI-powered analysis
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Upload Section */}
                    <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Upload className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Upload Dataset
                            </h2>
                        </div>
                        <FileUpload onUploadComplete={fetchDatasets} />
                    </div>

                    {/* Connect Database Card */}
                    <button
                        onClick={() => window.location.href = '/connect-database'}
                        className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 text-left"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">
                            Connect Database
                        </h3>
                        <p className="text-sm text-gray-600">
                            Link MySQL or PostgreSQL for direct querying
                        </p>
                    </button>

                    {/* Unified Chat Card */}
                    <button
                        onClick={() => window.location.href = '/unified-chat'}
                        className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 text-left"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                <MessageSquare className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                            Start Analysis
                        </h3>
                        <p className="text-sm text-gray-600">
                            Query all your data sources with AI
                        </p>
                    </button>
                </div>

                {/* Datasets Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Your Datasets</h2>
                            <p className="text-gray-600 mt-1">Manage your uploaded files</p>
                        </div>
                        <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">
                            {datasets.length} {datasets.length === 1 ? 'file' : 'files'}
                        </div>
                    </div>

                    {loading && datasets.length === 0 ? (
                        <div className="flex justify-center py-16">
                            <LoadingSpinner text="Loading datasets..." />
                        </div>
                    ) : datasets.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Upload className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 text-lg font-medium">No datasets yet</p>
                            <p className="text-gray-500 text-sm mt-2">
                                Upload your first CSV or Excel file to get started
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {datasets.map((dataset) => (
                                <DatasetCard
                                    key={dataset.id}
                                    dataset={dataset}
                                    onDelete={deleteDataset}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
