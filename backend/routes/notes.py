from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.note import Note
from extensions import db
import logging

# Set up logging
logger = logging.getLogger('notes_api')
logger.setLevel(logging.INFO)

note_bp = Blueprint('notes', __name__)

def verify_user_ownership(user_id, note_id=None):
    """
    Security helper to verify user owns the note they're trying to access.
    Returns (user, note, error_response) tuple.
    """
    user = User.query.get(int(user_id))
    
    if not user:
        logger.warning(f"User not found: {user_id}")
        return None, None, (jsonify({"error": "User not found"}), 404)
    
    # If no note_id, just return the user
    if note_id is None:
        return user, None, None
        
    # Verify user owns the note
    note = Note.query.filter_by(id=note_id, user_id=user.id).first()
    
    if not note:
        logger.warning(f"Unauthorized note access attempt: User {user_id} tried to access note {note_id}")
        return user, None, (jsonify({"error": "Note not found or not owned by user"}), 404)
        
    return user, note, None

@note_bp.route('/', methods=['GET'])
@jwt_required()
def get_notes():
    user_id = get_jwt_identity()
    user, _, error = verify_user_ownership(user_id)
    
    if error:
        return error
    
    # Query parameters for filtering
    category = request.args.get('category')
    is_pinned = request.args.get('isPinned')
    
    # Base query - only notes belonging to current user
    query = Note.query.filter_by(user_id=user.id)
    
    # Apply filters if provided
    if category:
        query = query.filter_by(category=category)
    
    if is_pinned is not None:
        is_pinned_bool = is_pinned.lower() == 'true'
        query = query.filter_by(is_pinned=is_pinned_bool)
    
    # Sort by pinned (descending) then updated_at (descending)
    notes = query.order_by(Note.is_pinned.desc(), Note.updated_at.desc()).all()
    
    return jsonify({
        "notes": [note.to_dict() for note in notes]
    })

@note_bp.route('/', methods=['POST'])
@jwt_required()
def create_note():
    user_id = get_jwt_identity()
    user, _, error = verify_user_ownership(user_id)
    
    if error:
        return error
    
    data = request.get_json()
    
    # Validate required fields
    if 'title' not in data:
        return jsonify({"error": "Title is required"}), 400
    
    # Create new note
    note = Note(
        user_id=user.id,
        title=data.get('title'),
        content=data.get('content', ''),
        category=data.get('category'),
        is_pinned=data.get('isPinned', False)
    )
    
    db.session.add(note)
    db.session.commit()
    
    logger.info(f"User {user.id} created new note {note.id}")
    
    return jsonify({
        "success": True,
        "note": note.to_dict()
    }), 201

@note_bp.route('/<int:note_id>', methods=['GET'])
@jwt_required()
def get_note(note_id):
    user_id = get_jwt_identity()
    user, note, error = verify_user_ownership(user_id, note_id)
    
    if error:
        return error
    
    return jsonify(note.to_dict())

@note_bp.route('/<int:note_id>', methods=['PUT'])
@jwt_required()
def update_note(note_id):
    user_id = get_jwt_identity()
    user, note, error = verify_user_ownership(user_id, note_id)
    
    if error:
        return error
    
    data = request.get_json()
    
    # Update note fields if provided
    if 'title' in data:
        note.title = data['title']
    
    if 'content' in data:
        note.content = data['content']
    
    if 'category' in data:
        note.category = data['category']
    
    if 'isPinned' in data:
        note.is_pinned = data['isPinned']
    
    db.session.commit()
    
    logger.info(f"User {user.id} updated note {note.id}")
    
    return jsonify({
        "success": True,
        "note": note.to_dict()
    })

@note_bp.route('/<int:note_id>', methods=['DELETE'])
@jwt_required()
def delete_note(note_id):
    user_id = get_jwt_identity()
    user, note, error = verify_user_ownership(user_id, note_id)
    
    if error:
        return error
    
    db.session.delete(note)
    db.session.commit()
    
    logger.info(f"User {user.id} deleted note {note.id}")
    
    return jsonify({
        "success": True,
        "message": "Note deleted successfully"
    })

@note_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    user_id = get_jwt_identity()
    user, _, error = verify_user_ownership(user_id)
    
    if error:
        return error
    
    # Get unique categories for user's notes
    categories = db.session.query(Note.category)\
                  .filter(Note.user_id == user.id, Note.category != None)\
                  .distinct()\
                  .all()
    
    # Extract category names from result tuples
    category_list = [category[0] for category in categories if category[0]]
    
    return jsonify({
        "categories": category_list
    })