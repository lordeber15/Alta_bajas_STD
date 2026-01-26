const express = require('express');
const router = express.Router();
const Persona = require('../models/persona');
const Usuario = require('../models/usuario');
const Area = require('../models/area');
const { Op } = require('sequelize');

/**
 * Obtener todos los usuarios (Directorio de Personal)
 * Excluye registros marcados como 'N/D' y vincula Persona y Área.
 */
router.get('/', async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            include: [
                {
                    model: Persona,
                    required: true,
                    where: {
                        nombre: { [Op.ne]: 'N/D' }
                    }
                },
                {
                    model: Area,
                    required: true,
                    where: {
                        area: { [Op.ne]: 'N/D' }
                    }
                }
            ]
        });
        res.json(usuarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el directorio de usuarios' });
    }
});

module.exports = router;
