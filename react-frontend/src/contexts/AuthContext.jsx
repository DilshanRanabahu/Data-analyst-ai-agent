/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Get ID token
                    const token = await user.getIdToken();
                    localStorage.setItem('authToken', token);

                    setCurrentUser(user);
                } catch (error) {
                    console.error('Error getting token:', error);
                    setCurrentUser(null);
                }
            } else {
                localStorage.removeItem('authToken');
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const register = async (email, password, displayName) => {
        try {
            // Create Firebase user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Register in backend
            await authAPI.register(email, password, displayName);

            toast.success('Account created successfully!');
            return user;
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('We could not create your account. Please check your details and try again.');
            throw error;
        }
    };

    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            toast.success('Logged in successfully!');
            return userCredential.user;
        } catch (error) {
            console.error('Login error:', error);
            toast.error('We could not log you in. Please check your credentials and try again.');
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('authToken');
            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('We had trouble signing you out. Please try again.');
            throw error;
        }
    };

    const value = {
        currentUser,
        loading,
        register,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export { AuthProvider, useAuth };
