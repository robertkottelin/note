import React, { useState, useEffect, useContext } from 'react';
import './App.css';
import NoteList from './components/notes/NoteList';
import NoteEditor from './components/notes/NoteEditor';
import Sidebar from './components/ui/Sidebar';
import AuthModal from './components/auth/AuthModal';
import { AuthContext } from './contexts/AuthContext';
import { NoteService } from './services/api';

function App() {
  const { isAuthenticated, isLoading: authLoading, currentUser, logout } = useContext(AuthContext);
  
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Load notes from API on component mount
  useEffect(() => {
    const loadNotes = async () => {
      if (isAuthenticated) {
        try {
          const fetchedNotes = await NoteService.getNotes();
          setNotes(fetchedNotes);
          
          // Also fetch categories
          const fetchedCategories = await NoteService.getCategories();
          setCategories(fetchedCategories);
        } catch (error) {
          console.error("Error loading notes:", error);
          setNotes([]);
        }
      } else {
        setNotes([]);
      }
      setIsLoading(false);
    };
    
    if (!authLoading) {
      loadNotes();
    }
  }, [isAuthenticated, authLoading]);

  // Filter notes based on selected category
  useEffect(() => {
    if (selectedCategory === null) {
      // Show all notes
      setFilteredNotes(notes);
    } else if (selectedCategory === 'uncategorized') {
      // Show notes without a category
      setFilteredNotes(notes.filter(note => !note.category));
    } else if (selectedCategory === 'pinned') {
      // Show pinned notes
      setFilteredNotes(notes.filter(note => note.isPinned));
    } else if (selectedCategory === 'recent') {
      // Show 5 most recent notes based on updatedAt
      setFilteredNotes([...notes]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5)
      );
    } else {
      // Show notes with the selected category
      setFilteredNotes(notes.filter(note => note.category === selectedCategory));
    }
  }, [selectedCategory, notes]);

  // Create a new note
  const handleCreateNote = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      const newNote = await NoteService.createNote({
        title: 'Untitled Note',
        content: '',
        category: selectedCategory !== 'uncategorized' && 
                 selectedCategory !== 'pinned' && 
                 selectedCategory !== 'recent' && 
                 selectedCategory !== null 
                 ? selectedCategory : '',
        isPinned: false
      });
      
      setNotes([newNote, ...notes]);
      setSelectedNote(newNote);
    } catch (error) {
      console.error("Error creating note:", error);
      alert("Unable to create note. Please try again.");
    }
  };

  // Update an existing note
  const handleUpdateNote = async (updatedNoteData) => {
    if (!isAuthenticated || !selectedNote) return;
    
    try {
      const updatedNote = await NoteService.updateNote(selectedNote.id, updatedNoteData);
      
      // Update notes array
      setNotes(notes.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      ));
      
      // Update selected note
      setSelectedNote(updatedNote);
      
      // Update categories if needed
      if (updatedNote.category && !categories.includes(updatedNote.category)) {
        setCategories([...categories, updatedNote.category]);
      }
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  // Delete a note
  const handleDeleteNote = async (noteId) => {
    if (!isAuthenticated) return;
    
    try {
      await NoteService.deleteNote(noteId);
      
      // Remove from notes array
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      
      // Clear selected note if it's the one being deleted
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(null);
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Unable to delete note. Please try again.");
    }
  };

  // Toggle pin status for a note
  const handlePinNote = async (noteId, isPinned) => {
    if (!isAuthenticated) return;
    
    try {
      const noteToUpdate = notes.find(note => note.id === noteId);
      if (!noteToUpdate) return;
      
      const updatedNote = await NoteService.updateNote(noteId, { 
        ...noteToUpdate,
        isPinned 
      });
      
      // Update notes array
      setNotes(notes.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      ));
      
      // Update selected note if it's the one being pinned/unpinned
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(updatedNote);
      }
    } catch (error) {
      console.error("Error updating pin status:", error);
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    await logout();
    setNotes([]);
    setSelectedNote(null);
    setCategories([]);
  };

  // Show loading state while authentication is being determined
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="user-controls">
          {isAuthenticated ? (
            <div className="user-info">
              <span>Welcome, {currentUser?.email}</span>
              <button 
                className="btn btn-logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-login"
              onClick={() => setShowAuthModal(true)}
            >
              Login / Register
            </button>
          )}
        </div>
      </header>
      
      <main className="app-main">
        <Sidebar 
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onCreateNote={handleCreateNote}
          username={currentUser?.email?.split('@')[0]}
        />
        
        <NoteList 
          notes={filteredNotes}
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
          onDeleteNote={handleDeleteNote}
          onPinNote={handlePinNote}
        />
        
        {selectedNote ? (
          <NoteEditor 
            note={selectedNote}
            onSave={handleUpdateNote}
            categories={categories}
          />
        ) : (
          <div className="empty-editor">
            <div className="empty-editor-content">
              <h2>No note selected</h2>
              <p>Select a note from the list or create a new one</p>
              <button 
                className="create-note-button"
                onClick={handleCreateNote}
              >
                + New Note
              </button>
            </div>
          </div>
        )}
      </main>
      
      {/* Authentication Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}

export default App;