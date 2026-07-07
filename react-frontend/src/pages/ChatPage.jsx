import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { queryAPI, datasetAPI } from '../services/api';
import Navbar from '../components/Navbar';
import ChatMessage from '../components/ChatMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { Send, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const ChatPage = () => {
    const { datasetId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [dataset, setDataset] = useState(null);
    const [messages, setMessages] = useState([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadDataset = useCallback(async () => {
        try {
            const data = await datasetAPI.get(datasetId);
            setDataset(data);
        } catch (error) {
            console.error('Error loading dataset:', error);
            toast.error('Failed to load dataset');
        }
    }, [datasetId]);

    const loadChatHistory = useCallback(async () => {
        try {
            setLoadingHistory(true);
            const history = await queryAPI.getHistory(datasetId);
            setMessages(history);
        } catch (error) {
            console.error('Error loading chat history:', error);
        } finally {
            setLoadingHistory(false);
        }
    }, [datasetId]);

    useEffect(() => {
        loadDataset();
        loadChatHistory();
    }, [datasetId, loadDataset, loadChatHistory]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim() || loading) return;

        const userQuery = query.trim();
        setQuery('');
        setLoading(true);

        try {
            const response = await queryAPI.send(datasetId, userQuery, currentUser.uid);

            if (response.success) {
                // Add new message to chat
                const newMessage = {
                    id: response.messageId,
                    datasetId,
                    userId: currentUser.uid,
                    userMessage: userQuery,
                    aiResponse: response.response,
                    timestamp: new Date().toISOString(),
                    responseTimeMs: response.responseTimeMs,
                };
                setMessages([...messages, newMessage]);
            } else {
                toast.error(response.error || 'Query failed');
            }
        } catch (error) {
            console.error('Error sending query:', error);
            toast.error('There was a problem sending your question. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            {dataset?.fileName || 'Loading...'}
                        </h1>
                        {dataset && (
                            <p className="text-sm text-gray-500">
                                {dataset.rowCount} rows × {dataset.columnCount} columns
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    {loadingHistory ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner text="Loading chat history..." />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg mb-2">No messages yet</p>
                            <p className="text-gray-400 text-sm">
                                Ask a question about your data to get started
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((message) => (
                                <ChatMessage key={message.id} message={message} />
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 px-4 py-4">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask a question about your data..."
                            disabled={loading}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <LoadingSpinner size="sm" text="" />
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatPage;
