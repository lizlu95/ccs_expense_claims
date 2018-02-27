'use strict';
module.exports = (sequelize, DataTypes) => {
    var Configuration = sequelize.define('Configuration', {
        json: DataTypes.JSON
    }, {
        underscored: true,
        tableName: 'configurations',
    });

    Configuration.associate = function (models) {
        // TODO
    };

    return Configuration;
};