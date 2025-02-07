const express = require('express');
const router = express.Router();
const Task = require('../models/task.model');
const Group = require('../models/group.model');
const auth = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const mongoose = require('mongoose');

const upload = multer({
  limits: {
    fileSize: 5000000 
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image file'));
    }
    cb(null, true);
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.body.group,
      'members.user': req.user._id
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found or unauthorized' });
    }

    const task = new Task({
      ...req.body,
      group: group._id
    });

    await task.save();
    group.tasks.push(task._id);
    await group.save();
    
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId || groupId === 'undefined' || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ 
        error: 'ID de grupo no válido' 
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        error: 'Grupo no encontrado' 
      });
    }

    const tasks = await Task.find({ group: groupId })
      .populate('assignedTo', 'username email avatar')
      .sort({ createdAt: -1 });

    console.log('Tasks found:', tasks);
    res.json(tasks);
  } catch (error) {
    console.error('Error getting group tasks:', error);
    res.status(500).json({ 
      error: 'Error al obtener las tareas del grupo' 
    });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Manejar el caso especial de desasignación
    if (updates.assignedTo === '') {
      updates.assignedTo = null;
    }

    const task = await Task.findOne({
      _id: req.params.id
    }).populate('assignedTo', 'name email');

    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // Verificar que el usuario tiene acceso al grupo de la tarea
    const group = await Group.findById(task.group);
    if (!group || !group.members.some(member => member.user.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta tarea' });
    }

    // Si se está asignando la tarea, verificar que el usuario asignado es miembro del grupo
    if (updates.assignedTo && updates.assignedTo !== null) {
      const isMember = group.members.some(member => member.user.toString() === updates.assignedTo.toString());
      if (!isMember) {
        return res.status(400).json({ error: 'El usuario asignado debe ser miembro del grupo' });
      }
    }

    Object.keys(updates).forEach((update) => {
      task[update] = updates[update];
    });

    await task.save();
    
    // Repopular los campos necesarios antes de enviar la respuesta
    await task.populate('assignedTo', 'name email');
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/comments', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      group: { $in: req.user.groups }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    task.comments.push({
      user: req.user._id,
      content: req.body.content
    });

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/images', auth, upload.array('images', 5), async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      group: { $in: req.user.groups }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'task-manager'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve({
              url: result.secure_url,
              public_id: result.public_id
            });
          }
        );

        uploadStream.end(file.buffer);
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);
    task.images.push(...uploadedImages);
    await task.save();
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
