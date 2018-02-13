'use strict';
module.exports = (sequelize, DataTypes) => {
    var Configuration = sequelize.define('Configuration', {
        name: DataTypes.STRING,
        value: DataTypes.INTEGER
    }, {
        underscored: true,
        tableName: 'configurations',
    });

    Configuration.associate = function (models) {
        // TODO
    };

    return Configuration;
};