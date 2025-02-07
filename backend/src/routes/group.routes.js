const express = require('express');
const router = express.Router();
const Group = require('../models/group.model');
const User = require('../models/user.model');
const auth = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Create group
router.post('/', auth, async (req, res) => {
  try {
    const { title, name, description } = req.body;
    // Permitir que el campo title pueda venir como name
    const groupTitle = title || name;
    
    if (!groupTitle || !description) {
      return res.status(400).json({ 
        error: 'Título y descripción son requeridos' 
      });
    }

    const group = new Group({
      title: groupTitle,
      description,
      members: [{
        user: req.user._id,
        role: 'creator'
      }]
    });

    await group.save();
    
    // Actualizar el array de grupos del usuario
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { groups: group._id } }
    );
    
    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', 'username email avatar');
    
    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user's groups
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'groups',
        populate: {
          path: 'members.user',
          select: 'username email avatar'
        }
      });
    res.json(user.groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get group by id
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el ID sea válido antes de hacer la consulta
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: 'ID de grupo no válido' 
      });
    }

    const group = await Group.findById(id)
      .populate('members.user', 'username email avatar');

    if (!group) {
      return res.status(404).json({ 
        error: 'Grupo no encontrado' 
      });
    }

    // Verificar que el usuario tenga acceso al grupo
    const isMember = group.members.some(
      member => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ 
        error: 'No tienes permiso para ver este grupo' 
      });
    }

    res.json(group);
  } catch (error) {
    console.error('Error getting group:', error);
    res.status(500).json({ 
      error: 'Error al obtener el grupo' 
    });
  }
});

// Update group
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title && !description) {
      return res.status(400).json({ 
        error: 'Se requiere al menos un campo para actualizar' 
      });
    }

    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    // Verificar si el usuario es el creador
    const isCreator = group.members.some(
      member => member.user.toString() === req.user._id.toString() && member.role === 'creator'
    );

    if (!isCreator) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar este grupo' });
    }

    if (title) group.title = title;
    if (description) group.description = description;

    await group.save();
    
    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'username email avatar')
      .populate('tasks');

    res.json(updatedGroup);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete group
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    // Verificar si el usuario es el creador
    const isCreator = group.members.some(
      member => member.user.toString() === req.user._id.toString() && member.role === 'creator'
    );

    if (!isCreator) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este grupo' });
    }

    // Eliminar el grupo de los usuarios
    await User.updateMany(
      { groups: group._id },
      { $pull: { groups: group._id } }
    );

    await group.remove();
    res.json({ message: 'Grupo eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add member to group
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'ID de usuario no proporcionado' });
    }

    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    // Verificar si el usuario ya es miembro
    const isMember = group.members.some(
      member => member.user.toString() === userId
    );

    if (isMember) {
      return res.status(400).json({ error: 'El usuario ya es miembro del grupo' });
    }

    group.members.push({
      user: userId,
      role: 'member'
    });

    await group.save();
    
    // Actualizar el array de grupos del usuario
    await User.findByIdAndUpdate(
      userId,
      { $push: { groups: group._id } }
    );

    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'username email avatar')
      .populate('tasks');

    res.json(updatedGroup);
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(400).json({ error: error.message });
  }
});

// Remove member from group
router.delete('/:groupId/members/:userId', auth, async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    // Verificar si el usuario a eliminar es el creador
    const memberToRemove = group.members.find(
      member => member.user.toString() === userId
    );

    if (!memberToRemove) {
      return res.status(404).json({ error: 'Usuario no encontrado en el grupo' });
    }

    if (memberToRemove.role === 'creator') {
      return res.status(400).json({ error: 'No se puede eliminar al creador del grupo' });
    }

    // Verificar si el usuario que hace la petición es el creador o el mismo usuario
    const isCreator = group.members.some(
      member => member.user.toString() === req.user._id.toString() && member.role === 'creator'
    );

    if (!isCreator && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este miembro' });
    }

    // Eliminar el miembro del grupo
    group.members = group.members.filter(
      member => member.user.toString() !== userId
    );

    await group.save();
    
    // Eliminar el grupo del usuario
    await User.findByIdAndUpdate(
      userId,
      { $pull: { groups: groupId } }
    );

    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'username email avatar')
      .populate('tasks');

    res.json(updatedGroup);
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para generar un enlace de invitación
router.post('/:id/invite', auth, async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    
    // Verificar que el usuario es miembro del grupo
    if (!group.members.some(member => member.user.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'No tienes permiso para invitar a este grupo' });
    }
    
    // Generar un código único para la invitación
    const inviteCode = crypto.randomBytes(16).toString('hex');
    
    // Guardar el código de invitación en el grupo
    group.inviteCodes = group.inviteCodes || [];
    group.inviteCodes.push({
      code: inviteCode,
      createdBy: req.user._id,
      createdAt: new Date()
    });
    
    await group.save();
    
    res.json({ inviteCode });
  } catch (error) {
    console.error('Error generating invite link:', error);
    res.status(500).json({ error: 'Error al generar el enlace de invitación' });
  }
});

// Endpoint para unirse a un grupo mediante código de invitación
router.post('/join/:inviteCode', auth, async (req, res) => {
  try {
    const { inviteCode } = req.params;
    
    // Buscar el grupo que tenga este código de invitación
    const group = await Group.findOne({
      'inviteCodes.code': inviteCode
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Código de invitación no válido o expirado' });
    }
    
    // Verificar si el usuario ya es miembro
    if (group.members.some(member => member.user.toString() === req.user._id.toString())) {
      return res.status(400).json({ error: 'Ya eres miembro de este grupo' });
    }
    
    // Añadir el usuario al grupo
    group.members.push({
      user: req.user._id,
      role: 'member'
    });
    await group.save();
    
    res.json(group);
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ error: 'Error al unirse al grupo' });
  }
});

module.exports = router;
