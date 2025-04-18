import React from 'react';
import './Notes.css';

const NoteList = ({ notes, selectedNote, onSelectNote, onDeleteNote, onPinNote }) => {
  // Format date to display in a user-friendly way
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Sort notes: pinned notes first, then by updated date
  const sortedNotes = [...notes].sort((a, b) => {
    // First sort by pin status
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then sort by updated date
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  // Create a truncated preview of note content
  const getContentPreview = (content) => {
    if (!content) return '';
    return content.substring(0, 100) + (content.length > 100 ? '...' : '');
  };

  return (
    <div className="note-list">
      <div className="note-list-header">
        <h2>My Notes</h2>
        <div className="note-count">{notes.length} notes</div>
      </div>

      {sortedNotes.length === 0 ? (
        <div className="note-list-empty">
          <p>No notes yet. Create your first note!</p>
        </div>
      ) : (
        <div className="note-list-items">
          {sortedNotes.map(note => (
            <div 
              key={note.id} 
              className={`note-list-item ${selectedNote?.id === note.id ? 'selected' : ''}`}
              onClick={() => onSelectNote(note)}
            >
              <div className="note-list-item-header">
                <h3 className="note-list-item-title">
                  {note.isPinned && <span className="pin-icon">📌</span>}
                  {note.title || 'Untitled'}
                </h3>
                <div className="note-list-item-actions">
                  <button 
                    className="note-action-button pin-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPinNote(note.id, !note.isPinned);
                    }}
                    title={note.isPinned ? "Unpin" : "Pin"}
                  >
                    {note.isPinned ? '📌' : '📍'}
                  </button>
                  <button 
                    className="note-action-button delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this note?')) {
                        onDeleteNote(note.id);
                      }
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="note-list-item-preview">
                {getContentPreview(note.content)}
              </div>
              <div className="note-list-item-footer">
                <span className="note-list-item-date">
                  {formatDate(note.updatedAt)}
                </span>
                {note.category && (
                  <span className="note-list-item-category">
                    {note.category}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoteList;