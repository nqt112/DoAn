module.exports = {
  up: async (queryInterface, Sequelize) => {
    const roomCategories = [
      { id: 1, floor: 1 }, // Room category 1 is on floor 1
      { id: 2, floor: 2 }, // Room category 2 is on floor 2
      { id: 3, floor: 3 }, // Room category 3 is on floor 3
      { id: 4, floor: 4 }, // Room category 3 is on floor 3
    ];
    const roomsPerFloor = 15;
    const roomStatus = "Kích hoạt"; // Adjust this if you need to map it to a specific enum value

    let rooms = [];

    roomCategories.forEach(category => {
      const { id, floor } = category;
      for (let roomNumber = 1; roomNumber <= roomsPerFloor; roomNumber++) {
        rooms.push({
          roomCategoryId: id,
          roomNumber: `P${floor}${String(roomNumber).padStart(2, '0')}`,
          floor: floor,
          status: roomStatus, // Adjust this if you need to map it to BookingStatusEnum[roomStatus]
          createdAt: new Date(),
        updatedAt: new Date(),
        });
      }
    });

    return queryInterface.bulkInsert('Room', rooms, {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Room', null, {});
  },
};
