'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Room_category', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      square: {
        type: Sequelize.DECIMAL(10,2)
      },
      numberOfPeople: {
        type: Sequelize.INTEGER
      },
      typeOfBed: {
        type: Sequelize.STRING
      },
      price: {
        type: Sequelize.DOUBLE
      },
      description: {
        type: Sequelize.STRING(500)
      },
      image: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Room_category');
  }
};