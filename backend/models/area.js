const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Area = sequelize.define('tbl_area', {
    id_area: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    area: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = Area;
