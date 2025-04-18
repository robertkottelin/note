import React, { useState, useEffect } from 'react';
import './Notes.css';

const NoteEditor = ({ note, onSave, categories }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Update local state when the selected note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setCategory(note.category || '');
      setIsPinned(note.isPinned || false);
      setIsNewCategory(false);
      setNewCategory('');
    } else {
      // Clear state when there's no selected note
      setTitle('');
      setContent('');
      setCategory('');
      setIsPinned(false);
      setIsNewCategory(false);
      setNewCategory('');
    }
  }, [note]);

  // Auto-save handler with debounce
  const autoSave = () => {
    if (!title || isSaving) return;
    
    setIsSaving(true);
    
    const updatedNote = {
      title,
      content,
      category: isNewCategory ? newCategory : category,
      isPinned
    };
    
    onSave(updatedNote);
    setLastSaved(new Date());
    setIsSaving(false);
  };

  // Setup auto-save timer
  useEffect(() => {
    const saveTimer = setTimeout(autoSave, 2000);
    return () => clearTimeout(saveTimer);
  }, [title, content, category, newCategory, isPinned, isNewCategory]);

  // Format last saved time
  const getLastSavedText = () => {
    if (!lastSaved) return '';
    
    const now = new Date();
    const diffMs = now - lastSaved;
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) {
      return 'Saved just now';
    } else if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      return `Saved ${mins} minute${mins > 1 ? 's' : ''} ago`;
    } else {
      return `Saved at ${lastSaved.toLocaleTimeString()}`;
    }
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    
    if (value === 'new') {
      setIsNewCategory(true);
      setCategory('');
    } else {
      setIsNewCategory(false);
      setCategory(value);
    }
  };

  // Handle manual save
  const handleSave = () => {
    if (!title) return;
    
    autoSave();
  };

  return (
    <div className="note-editor">
      <div className="note-editor-header">
        <input
          type="text"
          className="note-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
        />
        
        <div className="note-editor-actions">
          <div className="note-pin-toggle">
            <label>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              Pin note
            </label>
          </div>
          
          <button 
            className="save-button"
            onClick={handleSave}
            disabled={!title || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      
      <div className="note-editor-category">
        <select 
          value={isNewCategory ? 'new' : category} 
          onChange={handleCategoryChange}
        >
          <option value="">No Category</option>
          {categories.map((cat, index) => (
            <option key={index} value={cat}>{cat}</option>
          ))}
          <option value="new">+ Add new category</option>
        </select>
        
        {isNewCategory && (
          <input
            type="text"
            className="new-category-input"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
          />
        )}
      </div>
      
      <textarea
        className="note-content-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your note here..."
      />
      
      <div className="note-editor-footer">
        {lastSaved && (
          <span className="last-saved-status">{getLastSavedText()}</span>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;