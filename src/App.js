// This is the full, updated code for: src/App.js

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, onSnapshot, query, orderBy, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { encryptMessage, decryptMessage } from './encryptionService';

// --- Firebase Configuration ---
// Make sure your Firebase config object is pasted here.
const firebaseConfig = {
    apiKey: "AIzaSyCup-Vgd3q9Ip0LQLUy8fqM9PgSiUOQBwI",
    authDomain: "chat-app-71f3d.firebaseapp.com",
    projectId: "chat-app-71f3d",
    storageBucket: "chat-app-71f3d.firebasestorage.app",
    messagingSenderId: "180230460744",
    appId: "1:180230460744:web:9ee5aedbe3fd1b14db0f7d",
    measurementId: "G-VT1V9B4J77"
  };
  

const appId = 'secure-e2ee-chat';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// ===================================================================
//  VIEW 1: The Landing Page Component
// ===================================================================
const HomePage = ({ onCreateLink }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white">Disposable e2ee-chat</h1>
                    <p className="text-lg text-gray-400 mt-2">A secure, end-to-end encrypted environment.</p>
                </div>
                <div className="bg-gray-800 p-8 rounded-lg mt-10 w-full max-w-md mx-auto shadow-2xl">
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                        <li>No login or signup required.</li>
                        <li>No trackers or ads.</li>
                        <li>Your messages are end-to-end encrypted - technically impossible for anyone else to read.</li>
                    </ul>
                    <button
                        onClick={onCreateLink}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg mt-8 transition duration-300 transform hover:scale-105"
                    >
                        Create chat link
                    </button>
                </div>
                <div className="bg-gray-800 p-8 rounded-lg mt-10 w-full shadow-2xl">
                    <h2 className="text-2xl font-bold text-center mb-6">How It Works ✨</h2>
                    <ul className="list-decimal list-inside text-gray-300 space-y-3">
                        <li><b>Join a Chat Room:</b> Share a link and connect instantly.</li>
                        <li><b>Secret Key Generation:</b> A unique AES encryption key is cryptographically generated from your secret room link.</li>
                        <li><b>Encrypt Before Sending:</b> Your message is scrambled into secret code on your device before it's sent.</li>
                        <li><b>Secure Transmission:</b> The encrypted message flies safely across the web.</li>
                        <li><b>Decrypt on Arrival:</b> Only the recipient's device, using the same secret key, can unlock and read it.</li>
                        <li className="font-bold pt-2">Result: Private chats, zero snooping — like texting in invisibility mode. 🕵️‍♂️</li>
                    </ul>
                </div>
                <div className="bg-gray-800 p-8 rounded-lg mt-10 w-full shadow-2xl">
                     <h2 className="text-2xl font-bold text-center mb-6">Team Members</h2>
                     <ul className="text-gray-300 space-y-2 text-center text-lg">
                        <li>Venkatesh Badiger - 1MS22AD060</li>
                        <li>Neeraj Walasang - 1MS22AD037</li>
                        <li>Sneha Zimolson Paul - 1MS22AD056</li>
                        <li>Gokul Naik - 1MS22AD024</li>
                     </ul>
                </div>
                 <div className="text-center mt-10 mb-4 text-gray-500">
                    <p>The source-code is public on <a href="https://github.com/VenkateshBadiger/secure-chat-app" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline">Github</a>, feel free to contribute!</p>
                </div>
            </div>
        </div>
    );
};

// ===================================================================
//  VIEW 2: The Share Link Page Component
// ===================================================================
const SharePage = ({ roomId, onOpenChat }) => {
    const [copied, setCopied] = useState(false);
    const chatLink = `${window.location.origin}/${roomId}`;

    const copyLink = () => {
        navigator.clipboard.writeText(chatLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white">Anyone with the link can join</h1>
                <p className="text-lg text-gray-400 mt-2">Share this link to invite others to your private chat.</p>
            </div>
            <div className="bg-gray-800 p-8 rounded-lg mt-10 w-full max-w-2xl shadow-2xl">
                <label className="text-sm text-gray-400">Share chat link</label>
                <div className="flex items-center space-x-2 mt-2">
                    <input type="text" readOnly value={chatLink} className="flex-1 bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none" />
                    <button onClick={copyLink} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300">{copied ? 'Copied!' : 'Copy'}</button>
                </div>
                <button onClick={onOpenChat} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg mt-8 transition duration-300 transform hover:scale-105">Open chat</button>
            </div>
        </div>
    );
};


// ===================================================================
//  NEW COMPONENT: Confirmation Modal for Deleting Chat
// ===================================================================
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
                <h2 className="text-xl font-bold text-white mb-4">Delete Chat?</h2>
                <p className="text-gray-300 mb-6">Are you sure you want to permanently delete all messages in this chat? This action cannot be undone.</p>
                <div className="flex justify-end space-x-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-red-400"
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// ===================================================================
//  VIEW 3: The Chat Room Component (NOW INCLUDES DELETE FUNCTIONALITY)
// ===================================================================
const ChatRoom = ({ roomId, user }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State for modal
    const [isDeleting, setIsDeleting] = useState(false); // State for deletion process
    const messagesEndRef = useRef(null);

    // Effect for fetching messages
    useEffect(() => {
        if (!roomId) return;
        const roomMessagesRef = collection(db, `artifacts/${appId}/public/data/chat-rooms/${roomId}/messages`);
        const q = query(roomMessagesRef, orderBy('createdAt'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
        }, (err) => { setError("Failed to load messages."); });
        return () => unsubscribe();
    }, [roomId]);

    // Effect to scroll to the latest message
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || !roomId) return;
        const encryptedMessage = encryptMessage(newMessage, roomId);
        const roomMessagesRef = collection(db, `artifacts/${appId}/public/data/chat-rooms/${roomId}/messages`);
        try {
            await addDoc(roomMessagesRef, { text: encryptedMessage, createdAt: serverTimestamp(), uid: user.uid });
            setNewMessage('');
        } catch (err) { setError("Message could not be sent."); }
    };

    // --- NEW: Function to delete all messages in the chat ---
    const handleDeleteChat = async () => {
        setIsDeleting(true);
        setError('');
        const roomMessagesRef = collection(db, `artifacts/${appId}/public/data/chat-rooms/${roomId}/messages`);
        try {
            const querySnapshot = await getDocs(roomMessagesRef);
            // Use a batch to delete all documents efficiently
            const batch = writeBatch(db);
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (err) {
            console.error("Error deleting chat:", err);
            setError("Failed to delete chat. Please try again.");
        }
        setIsDeleting(false);
        setIsDeleteModalOpen(false); // Close modal after action
    };

    const Message = ({ message, roomId }) => {
        const { text, uid, createdAt } = message;
        const decryptedText = decryptMessage(text, roomId);
        const isMe = user && user.uid === uid;
        const formatTimestamp = (timestamp) => {
            if (!timestamp) return '';
            return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        };
        return (
            <div className={`flex items-end mb-1 animate-fade-in ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-xl shadow-md ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                    <p className="text-sm break-words">{decryptedText}</p>
                    <p className={`text-xs opacity-60 mt-1 ${isMe ? 'text-left' : 'text-right'}`}>{formatTimestamp(createdAt)}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
            {/* --- NEW: Render the confirmation modal --- */}
            <DeleteConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteChat}
                isDeleting={isDeleting}
            />

            <header className="bg-gray-800 shadow-lg p-4 flex justify-between items-center z-10">
                <div>
                    <h1 className="text-xl font-bold text-white">Encrypted Chat</h1>
                    <p className="text-xs text-green-400">End-to-End Encrypted</p>
                </div>
                {/* --- NEW: Delete Chat button --- */}
                <button 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                >
                    Delete Chat
                </button>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                {error && <p className="text-center text-red-400 p-2">{error}</p>}
                <div className="flex flex-col space-y-4">
                    {messages.length > 0 ? (
                         messages.map(msg => <Message key={msg.id} message={msg} roomId={roomId} />)
                    ) : (
                        <div className="text-center text-gray-500 mt-8">
                            <p>No messages yet.</p>
                            <p>Send the first message to start the conversation!</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>
            <footer className="bg-gray-800 p-4">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your encrypted message..." className="flex-1 bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-2 text-white" />
                    <button type="submit" disabled={!newMessage.trim()} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed">Send</button>
                </form>
            </footer>
        </div>
    );
};


// ===================================================================
//  The MAIN APP component that manages which view is shown
// ===================================================================
export default function App() {
    const [view, setView] = useState('loading'); // loading, home, share, chat
    const [roomId, setRoomId] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const pathRoomId = window.location.pathname.substring(1).replace(/[^a-zA-Z0-9-]/g, '');
        onAuthStateChanged(auth, async (currentUser) => {
            let signedInUser = currentUser;
            if (!signedInUser) {
                try {
                    const userCredential = await signInAnonymously(auth);
                    signedInUser = userCredential.user;
                } catch (err) { setView('error'); return; }
            }
            setUser(signedInUser);
            if (pathRoomId) {
                setRoomId(pathRoomId);
                setView('chat');
            } else {
                setView('home');
            }
        });
    }, []);

    const handleCreateLink = () => {
        const newRoomId = doc(collection(db, 'temp')).id;
        window.history.pushState({}, '', `/${newRoomId}`);
        setRoomId(newRoomId);
        setView('share');
    };

    const handleOpenChat = () => { setView('chat'); };

    if (view === 'loading') return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Initializing...</div>;
    if (view === 'home') return <HomePage onCreateLink={handleCreateLink} />;
    if (view === 'share') return <SharePage roomId={roomId} onOpenChat={handleOpenChat} />;
    if (view === 'chat') return <ChatRoom roomId={roomId} user={user} />;
    if (view === 'error') return <div className="flex items-center justify-center h-screen bg-gray-900 text-red-500">Failed to authenticate. Please refresh the page.</div>;
    return null;
}