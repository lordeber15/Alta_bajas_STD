const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Persona = sequelize.define('tbl_persona', {
    id_persona: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    documento: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cargo: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = Persona;
