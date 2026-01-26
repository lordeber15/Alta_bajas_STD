const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Persona = require('./persona');
const Area = require('./area');

const Usuario = sequelize.define('tbl_usuario', {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usuario: {
        type: DataTypes.STRING,
        allowNull: false
    },
    id_persona: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Persona,
            key: 'id_persona'
        }
    },
    id_area: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Area,
            key: 'id_area'
        }
    },
    id_rol: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 8 // 8: Activo, 9: Inactivo
    }
});

// Relaciones
Persona.hasOne(Usuario, { foreignKey: 'id_persona' });
Usuario.belongsTo(Persona, { foreignKey: 'id_persona' });

Area.hasMany(Usuario, { foreignKey: 'id_area' });
Usuario.belongsTo(Area, { foreignKey: 'id_area' });

module.exports = Usuario;
