import React from 'react';
import './Sidebar.css';

const Sidebar = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory, 
  onCreateNote, 
  username 
}) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Notepad</h1>
        {username && <div className="user-greeting">Hello, {username}</div>}
      </div>
      
      <div className="sidebar-actions">
        <button 
          className="create-note-button"
          onClick={onCreateNote}
        >
          + New Note
        </button>
      </div>
      
      <div className="sidebar-section">
        <h3>Categories</h3>
        <ul className="category-list">
          <li 
            className={selectedCategory === null ? 'active' : ''}
            onClick={() => onSelectCategory(null)}
          >
            All Notes
          </li>
          <li 
            className={selectedCategory === 'uncategorized' ? 'active' : ''}
            onClick={() => onSelectCategory('uncategorized')}
          >
            Uncategorized
          </li>
          {categories.map((category, index) => (
            <li 
              key={index}
              className={selectedCategory === category ? 'active' : ''}
              onClick={() => onSelectCategory(category)}
            >
              {category}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="sidebar-section">
        <h3>Smart Filters</h3>
        <ul className="filter-list">
          <li onClick={() => onSelectCategory('pinned')}>
            📌 Pinned
          </li>
          <li onClick={() => onSelectCategory('recent')}>
            🕒 Recent
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;