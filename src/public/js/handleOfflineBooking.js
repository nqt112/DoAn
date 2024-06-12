  // Lấy tất cả các phần tử có class là "dateInput"
  var dateInputs = document.getElementsByClassName("dateInput");

  // Lấy tất cả các phần tử có class là "dateOutput"
  var dateOutputs = document.getElementsByClassName("dateOutput");

  // Lấy ngày hiện tại
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
  var yyyy = today.getFullYear();
  var todayString = yyyy + '-' + mm + '-' + dd;

  // Thiết lập giá trị tối thiểu cho các input
  for (var i = 0; i < dateInputs.length; i++) {
      dateInputs[i].setAttribute("min", todayString);
  }

  // Kiểm tra khi có sự thay đổi trong input
  for (var i = 0; i < dateInputs.length; i++) {
    dateInputs[i].addEventListener("change", function () {
        var selectedDate = new Date(this.value); // Ngày được chọn trong dateInput
        var dd = String(selectedDate.getDate()).padStart(2, '0');
        var mm = String(selectedDate.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
        var yyyy = selectedDate.getFullYear();
        var selectedDateString = yyyy + '-' + mm + '-' + dd;

        // Hiển thị ngày đã chọn trong phần tử dateOutput
        for (var j = 0; j < dateOutputs.length; j++) {
            dateOutputs[j].innerText = "Ngày đã chọn: " + selectedDateString;
            dateOutputs[j].setAttribute("min", selectedDateString); // Giới hạn dateOutput từ ngày được chọn

            // Giới hạn dateOutput từ ngày được chọn + 1
            var nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            var nextDayString = nextDay.toISOString().split('T')[0];
            dateOutputs[j].setAttribute("min", nextDayString);
        }
    });
}
// Khởi tạo mảng rooms và services
var rooms = [];
var services = [];

function addRoomInput() {
  var roomTypeSelect = document.getElementById('roomType');
  var selectedOption = roomTypeSelect.options[roomTypeSelect.selectedIndex];
  var roomTypeId = selectedOption.value; // Lấy ID của loại phòng
  var roomTypeName = selectedOption.dataset.name;
  var roomQuantity = document.getElementById('roomQuantity').value;

  // Kiểm tra nếu số lượng phòng là rỗng hoặc không phải là số hợp lệ
  if (!roomQuantity || roomQuantity <= 0) {
    alert('Vui lòng nhập số lượng phòng hợp lệ.');
    return;
  }

  var existingRoomIndex = rooms.findIndex(room => room.id === roomTypeId);

  if (existingRoomIndex !== -1) {
    // Nếu loại phòng đã tồn tại, tăng số lượng lên
    rooms[existingRoomIndex].quantity += parseInt(roomQuantity);
  } else {
    // Nếu loại phòng chưa tồn tại, thêm mới vào danh sách
    rooms.push({ id: roomTypeId, quantity: parseInt(roomQuantity) });
  }

  // Cập nhật giao diện
  updateSelectedRooms();
}

function updateSelectedRooms() {
  var selectedRooms = document.getElementById('selectedRooms');
  selectedRooms.innerHTML = ''; // Xóa nội dung cũ

  rooms.forEach(room => {
    var roomInfo = document.createElement('div');
    roomInfo.textContent = `${getRoomNameById(room.id)} x ${room.quantity}`;

    var removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn btn-danger btn-sm delete-room-btn';
    removeButton.innerHTML = "<i class='ti ti-trash'></i>";
    removeButton.style.marginLeft = '10px';
    removeButton.addEventListener('click', function () {
      // Xóa phòng khỏi danh sách
      rooms = rooms.filter(r => r.id !== room.id);
      // Cập nhật giao diện
      updateSelectedRooms();
    });

    roomInfo.appendChild(removeButton);
    selectedRooms.appendChild(roomInfo);
  });
}

function getRoomNameById(roomId) {
  var roomTypeSelect = document.getElementById('roomType');
  var selectedOption = [...roomTypeSelect.options].find(option => option.value === roomId);
  return selectedOption ? selectedOption.dataset.name : '';
}

function addServiceInput() {
  var serviceNameSelect = document.getElementById('serviceName');
  var selectedOption = serviceNameSelect.options[serviceNameSelect.selectedIndex];
  var serviceId = selectedOption.value; // Lấy ID của dịch vụ
  var serviceName = selectedOption.dataset.name;
  var serviceQuantity = document.getElementById('serviceQuantity').value;

  // Kiểm tra nếu số lượng dịch vụ là rỗng hoặc không phải là số hợp lệ
  if (!serviceQuantity || serviceQuantity <= 0) {
    alert('Vui lòng nhập số lượng dịch vụ hợp lệ.');
    return;
  }

  // Kiểm tra xem dịch vụ đã tồn tại trong mảng services chưa
  var existingServiceIndex = services.findIndex(service => service.id === serviceId);

  if (existingServiceIndex !== -1) {
    // Nếu dịch vụ đã tồn tại, cập nhật số lượng
    services[existingServiceIndex].quantity += parseInt(serviceQuantity);
  } else {
    // Nếu dịch vụ chưa tồn tại, thêm mới vào mảng services
    services.push({ id: serviceId, quantity: parseInt(serviceQuantity) });
  }
  // Cập nhật giao diện
  updateSelectedServices();
}

function updateSelectedServices() {
  var selectedServices = document.getElementById('selectedServices');
  selectedServices.innerHTML = ''; // Xóa nội dung cũ

  services.forEach(service => {
    var serviceInfo = document.createElement('div');
    serviceInfo.textContent = `${getServiceNameById(service.id)} x ${service.quantity}`;

    var removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn btn-danger btn-sm delete-service-btn';
    removeButton.innerHTML = "<i class='ti ti-trash'></i>";
    removeButton.style.marginLeft = '10px';
    removeButton.addEventListener('click', function () {
      // Xóa dịch vụ khỏi mảng services
      services = services.filter(s => s.id !== service.id);
      // Cập nhật giao diện
      updateSelectedServices();
    });

    serviceInfo.appendChild(removeButton);
    selectedServices.appendChild(serviceInfo);
  });
}

function getServiceNameById(serviceId) {
  var serviceNameSelect = document.getElementById('serviceName');
  var selectedOption = [...serviceNameSelect.options].find(option => option.value === serviceId);
  return selectedOption ? selectedOption.dataset.name : '';
}

document.getElementById('bookingForm').addEventListener('submit', async function (event) {
  event.preventDefault(); // Ngăn chặn việc gửi form mặc định
  if (rooms.length === 0) {
    alert('Vui lòng thêm ít nhất một phòng trước khi gửi yêu cầu đặt phòng.');
    return;
  }
  // Lấy dữ liệu từ form
  const fullName = document.getElementById('fullName').value;
  const phoneNumber = document.getElementById('phoneNumber').value;
  const email = document.getElementById('email').value;
  const checkInTime = document.getElementById('checkInTime').value;
  const checkOutTime = document.getElementById('checkOutTime').value;
  try {
    if (checkInTime && checkOutTime) {
      // Gửi dữ liệu lên server để lưu vào cơ sở dữ liệu
      const formData = {
        fullname: fullName,
        phone: phoneNumber,
        email: email,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        rooms: rooms,
        services: services
      };
      alert(JSON.stringify(formData));
      // Gửi yêu cầu POST lên endpoint API
      const res = await fetch('/admin/api/saveBooking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Yêu cầu đặt phòng thành công!');
        location.reload();
      } else {
        throw new Error('Network response was not ok.');
      }
    }
  } catch (error) {
    console.error('There was an error!', error);
  }
});
