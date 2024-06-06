document.addEventListener('DOMContentLoaded', () => {
  const updateRoomButton = document.getElementById('updateRoomBtn');
  const updateRoomModalElement = document.getElementById('updateRoomModal');
  const updateRoomModal = new bootstrap.Modal(updateRoomModalElement);

  let selectedRooms = [];
  const bookingCodeInput = document.getElementById('bookingCodeInput');
  const updateRoomBtn = document.getElementById('postUpdateDayroom');
  const selectedRoomsInput = document.getElementById('selectedRoomsInput');
  const bookingIdInput = document.getElementById('bookingIdInput');

  updateRoomButton.addEventListener('click', () => {
    updateRoomModal.show();
  });

  const fetchAvailableRooms = async (params) => {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`/admin/api/getAvailableRooms?${query}`);
      if (!response.ok) {
        throw new Error('Failed to fetch available rooms');
      }
      const data = await response.json();
      return data.rooms;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const fetchBookingDetails = async (bookingCode) => {
    try {
      const response = await fetch(`/admin/api/getBookingId?bookingCode=${bookingCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const fetchBookedRooms = async (bookingId) => {
    try {
      const response = await fetch(`/admin/api/getBookedRooms?bookingId=${bookingId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch booked rooms');
      }
      const data = await response.json();
      return data.rooms;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const updateRoomList = async (params = {}) => {
    const availableRooms = await fetchAvailableRooms(params);
    const roomListContainer = document.getElementById('roomList');
    roomListContainer.innerHTML = '';

    availableRooms.forEach(room => {
      const isChecked = selectedRooms.includes(room.RoomId.toString());
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
        <td><input type="checkbox" data-room-id="${room.RoomId}" data-room-name="${room.RoomName}" ${isChecked ? 'checked' : ''}></td>
        <td>${room.RoomName}</td>
        <td>${room.Floor}</td>
      `;
      roomListContainer.appendChild(newRow);
    });
    attachCheckboxEventListeners();
  };

  const updateBookedRoomList = (bookedRooms) => {
    const selectedRoomsContainer = document.getElementById('selected-rooms-container');
    selectedRoomsContainer.innerHTML = '';

    bookedRooms.forEach(room => {
      if (!selectedRooms.includes(room.RoomId.toString())) {
        selectedRooms.push(room.RoomId.toString());
      }
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
        <td>${room.RoomName}</td>
        <td><button class="btn btn-danger btn-sm remove-room-btn" data-room-id="${room.RoomId}">&times;</button></td>
      `;
      selectedRoomsContainer.appendChild(newRow);
    });
    attachRemoveRoomEventListeners();
  };

  const attachCheckboxEventListeners = () => {
    const checkboxes = document.querySelectorAll('#roomList input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const roomId = checkbox.getAttribute('data-room-id');
        const roomName = checkbox.parentElement.nextElementSibling.textContent;

        if (checkbox.checked) {
          if (!selectedRooms.includes(roomId)) {
            selectedRooms.push(roomId);
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
              <td>${roomName}</td>
              <td><button class="btn btn-danger btn-sm remove-room-btn" data-room-id="${roomId}">&times;</button></td>
            `;
            document.getElementById('selected-rooms-container').appendChild(newRow);
            attachRemoveRoomEventListeners();
          }
        } else {
          selectedRooms = selectedRooms.filter(id => id !== roomId);
          const selectedRoomRows = document.querySelectorAll('#selected-rooms-container tr');
          selectedRoomRows.forEach(row => {
            if (row.querySelector('.remove-room-btn').getAttribute('data-room-id') === roomId) {
              row.remove();
            }
          });
          attachRemoveRoomEventListeners();
        }
        selectedRoomsInput.value = JSON.stringify(selectedRooms);
      });
    });
  };

  const attachRemoveRoomEventListeners = () => {
    const removeRoomButtons = document.querySelectorAll('.remove-room-btn');
    removeRoomButtons.forEach(button => {
      button.addEventListener('click', () => {
        const roomId = button.getAttribute('data-room-id');
        selectedRooms = selectedRooms.filter(id => id !== roomId);
        selectedRoomsInput.value = JSON.stringify(selectedRooms);
        button.parentElement.parentElement.remove();
        const checkbox = document.querySelector(`#roomList input[type="checkbox"][data-room-id="${roomId}"]`);
        if (checkbox) {
          checkbox.checked = false;
        }
      });
    });
  };

  updateRoomModalElement.addEventListener('hidden.bs.modal', () => {
    selectedRooms = [];
    selectedRoomsInput.value = '';
    bookingCodeInput.value = '';
    bookingIdInput.value = '';
    document.getElementById('modalStartDate').value = '';
    document.getElementById('modalEndDate').value = '';
    const selectedRoomsContainer = document.getElementById('selected-rooms-container');
    selectedRoomsContainer.innerHTML = '';
    updateRoomList();
  });

  document.getElementById('filter-btn').addEventListener('click', async () => {
    const roomType = document.getElementById('roomType').value;
    await updateRoomList({ roomType });
  });

  bookingCodeInput.addEventListener('blur', async (event) => {
    const bookingCode = event.target.value;
    if (bookingCode) {
      try {
        const bookingDetails = await fetchBookingDetails(bookingCode);
        if (bookingDetails) {
          const { checkIn, checkOut, bookingId } = bookingDetails;
          document.getElementById('modalStartDate').value = checkIn;
          document.getElementById('modalEndDate').value = checkOut;
          bookingIdInput.value = bookingId;

          await updateRoomList({ startDate: checkIn, endDate: checkOut });

          const bookedRooms = await fetchBookedRooms(bookingId);
          updateBookedRoomList(bookedRooms);
        } else {
          alert('Booking not found');
        }
      } catch (error) {
        console.error(error);
        alert('Failed to fetch booking details or available rooms');
      }
    }
  });

  updateRoomBtn.addEventListener('click', async () => {
    if (!bookingIdInput.value) {
      alert('Xin vui lòng nhập mã đơn đặt hợp lệ!');
      return;
    }
    
    try {
      selectedRoomsInput.value = JSON.stringify(selectedRooms);

      const bookingId = bookingIdInput.value;

      const response = await fetch('/admin/postUpdateDayroom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: bookingId,
          selectedRooms: selectedRooms
        })
      });

      if (response.ok) {
        alert("Cập nhật phòng ngày thành công!");
        updateRoomModal.hide();
      } else {
        throw new Error('Failed to save selected rooms');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save selected rooms');
    }
  });

  updateRoomList();
});
