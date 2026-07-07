/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { datasetAPI } from '../services/api';
import toast from 'react-hot-toast';

const DataContext = createContext({});

const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within DataProvider');
    }
    return context;
};

const DataProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [datasets, setDatasets] = useState([]);
    const [currentDataset, setCurrentDataset] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchDatasets = useCallback(async () => {
        if (!currentUser) return;

        try {
            setLoading(true);
            const data = await datasetAPI.list(currentUser.uid);
            setDatasets(data);
        } catch (error) {
            console.error('Error fetching datasets:', error);
            toast.error('We had trouble loading your files. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    // Fetch datasets when user changes
    useEffect(() => {
        if (currentUser) {
            fetchDatasets();
        } else {
            setDatasets([]);
            setCurrentDataset(null);
        }
    }, [currentUser, fetchDatasets]);

    const uploadDataset = async (file) => {
        if (!currentUser) {
            toast.error('You must be logged in to upload');
            return null;
        }

        try {
            setLoading(true);
            const response = await datasetAPI.upload(file, currentUser.uid);

            if (response.success) {
                toast.success('Dataset uploaded successfully!');
                await fetchDatasets(); // Refresh list
                return response;
            } else {
                toast.error('We could not upload your file. Please try again with a valid file.');
                return null;
            }
        } catch (error) {
            console.error('Error uploading dataset:', error);
            toast.error('There was a problem uploading your file. Please try again later.');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteDataset = async (id) => {
        try {
            setLoading(true);
            const response = await datasetAPI.delete(id);

            if (response.success) {
                toast.success('Dataset deleted successfully');
                await fetchDatasets(); // Refresh list
                if (currentDataset?.id === id) {
                    setCurrentDataset(null);
                }
            } else {
                toast.error('We could not delete the file. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting dataset:', error);
            toast.error('Failed to delete dataset');
        } finally {
            setLoading(false);
        }
    };

    const selectDataset = (dataset) => {
        setCurrentDataset(dataset);
    };

    const value = {
        datasets,
        currentDataset,
        loading,
        fetchDatasets,
        uploadDataset,
        deleteDataset,
        selectDataset,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export { DataProvider, useData };
