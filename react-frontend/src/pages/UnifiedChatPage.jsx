import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, FileText, Send, MessageSquare, Eye } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import Navbar from '../components/Navbar';
import SchemaVisualizer from '../components/SchemaVisualizer';
import toast from 'react-hot-toast';

const UnifiedChatPage = () => {
    const navigate = useNavigate();
    const [sources, setSources] = useState({ csvFiles: [], sqlDatabases: [] });
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingSources, setLoadingSources] = useState(true);
    const [selectedDbForSchema, setSelectedDbForSchema] = useState(null);

    const userId = localStorage.getItem('userId') || 'default_user';

    // Load user's data sources and chat history
    useEffect(() => {
        loadSources();
        loadChatHistory();
    }, []);

    const loadChatHistory = async () => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
            const response = await fetch(`${API_BASE_URL}/api/chat/unified`);
            if (response.ok) {
                const history = await response.json();
                // Convert to UI format
                const uiMessages = history.flatMap(msg => [
                    { type: 'user', content: msg.userMessage, timestamp: new Date(msg.timestamp) },
                    {
                        type: 'ai',
                        content: msg.aiResponse,
                        timestamp: new Date(msg.timestamp), // Use same timestamp for pair
                        // Note: sourcesUsed and rowCount might need to be added to ChatMessage model if needed
                    }
                ]);
                setMessages(uiMessages);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    };

    const loadSources = async () => {
        try {
            const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5000';
            const response = await fetch(`${PYTHON_API_URL}/api/sql/sources/${userId}`);
            const data = await response.json();

            if (data.success) {
                setSources(data.sources);
            }
        } catch (error) {
            console.error('Error loading sources:', error);
        } finally {
            setLoadingSources(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message to chat
        setMessages(prev => [...prev, {
            type: 'user',
            content: userMessage,
            timestamp: new Date()
        }]);

        setLoading(true);

        try {
            console.log('Sending unified query:', { userId, question: userMessage });
            console.log('Available sources:', sources);

            const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5000';
            const response = await fetch(`${PYTHON_API_URL}/api/unified/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    question: userMessage
                })
            });

            const data = await response.json();
            console.log('Unified query response:', data);

            if (data.success) {
                // Add AI response to chat
                const aiMessage = {
                    type: 'ai',
                    content: data.answer,
                    sourcesUsed: data.sourcesUsed,
                    rowCount: data.rowCount,
                    reportGenerated: data.reportGenerated || false,
                    reportFilename: data.reportFilename,
                    reportDownloadUrl: data.reportDownloadUrl,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMessage]);

                // Save to Spring Backend
                try {
                    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                    await fetch(`${API_BASE_URL}/api/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            datasetId: 'unified',
                            userId: userId,
                            userMessage: userMessage,
                            aiResponse: data.answer,
                            timestamp: new Date().toISOString(),
                            responseTimeMs: 0 // Optional
                        })
                    });
                } catch (err) {
                    console.error('Failed to save chat history:', err);
                }

            } else {
                console.error('Query failed:', data.message);
                toast.error('We could not process your question. Please try asking it differently.');
                // Show error in chat
                setMessages(prev => [...prev, {
                    type: 'ai',
                    content: `Sorry, I couldn't process your question. Please check your data sources or try asking it differently.`,
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Error processing query:', error);
            toast.error('There was a problem answering your question. Please try again later.');
            // Show error in chat
            setMessages(prev => [...prev, {
                type: 'ai',
                content: `Sorry, there was a system problem answering your question. Please try again in a few moments.`,
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const totalSources = sources.csvFiles.length + sources.sqlDatabases.length;

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Data Sources */}
                <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                        <h2 className="text-xl font-bold text-gray-900">Data Sources</h2>
                        <p className="text-sm text-gray-600 mt-1 font-medium">{totalSources} connected</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {loadingSources ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <>
                                {/* CSV Files */}
                                {sources.csvFiles.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">
                                            CSV Files
                                        </h3>
                                        <div className="space-y-2">
                                            {sources.csvFiles.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-200 cursor-pointer group"
                                                >
                                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                                        <FileText className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <span className="text-sm text-gray-700 truncate font-medium group-hover:text-blue-700 transition-colors">
                                                        {file.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* SQL Databases */}
                                {sources.sqlDatabases.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">
                                            Databases
                                        </h3>
                                        <div className="space-y-2">
                                            {sources.sqlDatabases.map((db) => (
                                                <div
                                                    key={db.id}
                                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all duration-200 group"
                                                >
                                                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                                        <Database className="w-4 h-4 text-emerald-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-700 truncate font-medium group-hover:text-emerald-700 transition-colors">{db.name}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{db.type}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setSelectedDbForSchema(db)}
                                                        className="p-1.5 bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-md shadow-sm border border-emerald-100 transition-all opacity-0 group-hover:opacity-100"
                                                        title="View Schema"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Empty State */}
                                {totalSources === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-gray-500 mb-4">
                                            No data sources yet
                                        </p>
                                        <button
                                            onClick={() => navigate('/dashboard')}
                                            className="text-sm text-blue-600 hover:text-blue-700"
                                        >
                                            Upload CSV
                                        </button>
                                        <span className="text-sm text-gray-400 mx-2">or</span>
                                        <button
                                            onClick={() => navigate('/connect-database')}
                                            className="text-sm text-blue-600 hover:text-blue-700"
                                        >
                                            Connect Database
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Add Data Button */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            + Add Data Source
                        </button>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-br from-blue-50/30 to-indigo-50/40">
                        {messages.length === 0 ? (
                            <div className="text-center py-16 max-w-2xl mx-auto">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                                    <MessageSquare className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                                    How can I help?
                                </h2>
                                <p className="text-gray-600 mb-10 text-lg">
                                    Ask questions about your CSV files and databases
                                </p>
                                <div className="grid grid-cols-1 gap-3 text-left">
                                    <button
                                        onClick={() => setInput("What's the total revenue in sales.csv?")}
                                        className="group px-5 py-4 bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-left"
                                    >
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">💰 What's the total revenue in sales.csv?</span>
                                    </button>
                                    <button
                                        onClick={() => setInput("Show top 10 customers from the database")}
                                        className="group px-5 py-4 bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-md rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-left"
                                    >
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700 transition-colors">👥 Show top 10 customers from the database</span>
                                    </button>
                                    <button
                                        onClick={() => setInput("Compare CSV data with database")}
                                        className="group px-5 py-4 bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-left"
                                    >
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700 transition-colors">📊 Compare CSV data with database</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            messages.map((message, index) => {
                                // Skip rendering independent user message if it's followed by an AI message
                                if (message.type === 'user' && index < messages.length - 1 && messages[index + 1].type === 'ai') {
                                    return null;
                                }

                                return (
                                    <div key={index}>
                                        {message.type === 'user' ? (
                                            <div className="flex justify-end">
                                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-sm px-5 py-3 max-w-2xl shadow-md">
                                                    <p className="text-sm font-medium">{message.content}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <ChatMessage
                                                    message={{
                                                        userMessage: messages[index - 1]?.content || '',
                                                        aiResponse: message.content,
                                                        timestamp: messages[index - 1]?.timestamp || new Date(),
                                                        responseTimeMs: message.timestamp ? (new Date() - new Date(messages[index - 1]?.timestamp)) : null
                                                    }}
                                                />
                                                {message.sourcesUsed && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 ml-12">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">{message.sourcesUsed.join(', ')}</span>
                                                        <span>•</span>
                                                        <span>{message.rowCount} rows</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}

                        {loading && (
                            <div className="flex items-center gap-2 text-gray-500">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <span className="ml-2">Analyzing...</span>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="bg-white border-t border-gray-200 p-6 shadow-lg">
                        <div className="max-w-4xl mx-auto flex gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask a question about your data..."
                                disabled={loading || totalSources === 0}
                                className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100 text-sm transition-all"
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim() || totalSources === 0}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                            >
                                <Send className="w-4 h-4" />
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Schema Visualizer Modal */}
            <SchemaVisualizer 
                isOpen={!!selectedDbForSchema} 
                onClose={() => setSelectedDbForSchema(null)} 
                database={selectedDbForSchema} 
            />
        </div>
    );
};

export default UnifiedChatPage;

