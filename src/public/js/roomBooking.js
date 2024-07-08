const roomItems = document.querySelectorAll(".room_list .room_item");
const roomSelectItemList = document.querySelector(".room_select_item_list");
const totalPrice = document.querySelector(".total-price");
const checkInValue = document.querySelector(".check-in-value");
const checkOutValue = document.querySelector(".check-out-value");
const dateInput = document.querySelector(".dateInput");
const dateOutput = document.querySelector(".dateOutput");
const submitButton = document.querySelector(".submit-button");
const paymentMethod = document.getElementById("paymentMethod")
const totalPriceElement = document.querySelector(".total-price-modal");
// --------------------- các hàm để dùng
const moneyFormat = (money) => {
    if (isNaN(money)) {
        return "0 ₫"; // Trả về giá trị mặc định nếu không phải là số
    }
    const formatter = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    });

    return formatter.format(money);
};
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
const updateTotalPriceModal = (total) => {
    const totalPriceModals = document.querySelectorAll(".total-price-modal");
    totalPriceModals.forEach((modal) => {
        modal.innerHTML = moneyFormat(total/2);
    });
};
const caculateTotal = () => {
    let total = 0;

    const roomSelectItems = roomSelectItemList.querySelectorAll(".room_select_item");
    const checkInDate = new Date(dateInput.value);
    const checkOutDate = new Date(dateOutput.value);
    const numberOfDays = Math.ceil((checkOutDate - checkInDate) / (1000 * 3600 * 24)); // Số ngày thuê

    roomSelectItems.forEach((roomSelectItem) => {
        const priceString = roomSelectItem.querySelector(".price").innerHTML;
        const cleanedPriceString = priceString.replace(/[^\d,]/g, '').replace(',', '.');
        const pricePerNight = Number(cleanedPriceString);
        const numberOfRooms = roomSelectItem.dataset.number;
        total += pricePerNight * numberOfRooms * numberOfDays;
    });

    totalPrice.innerHTML = moneyFormat(total);
    // totalPriceElement.innerHTML = moneyFormat(total);
    updateTotalPriceModal(total);
};

const createRoomSelectItem = (item, number) => {
    return `
    <tr class="room_select_item" data-id="${item.id}" data-number="${number}">
      <th scope="row">
          <div>
              <h5>
                  ${item.name}
              </h5>
          </div>
      </th>
      <td class="d-none">
          <span class="price">${item.price}</span> VNĐ/ Đêm
      </td>
      <td>
          ${number}
      </td>
    </tr>
  `;
};
let selectedPaymentMethod = "";
paymentMethod.addEventListener("change", function() {
    selectedPaymentMethod = this.value;
});
const handleValidateData = () => {
    if (!dateInput.value) {
        alert("Bạn phải nhập check in");
        return false;
    }
    if (!dateOutput.value) {
        alert("Bạn phải nhập check out");
        return false;
    }
    const roomSelectItems = roomSelectItemList.querySelectorAll(".room_select_item");
    if (roomSelectItems.length < 1) {
        alert("Bạn phải chọn ít nhất 1 phòng");
        return false;
    }
    if (!selectedPaymentMethod ) { // Nếu chưa chọn phương thức thanh toán
        alert("Vui lòng chọn phương thức thanh toán.");
        return false; // Dừng hàm xử lý
    }
    const total_price_str = totalPrice.innerText.replace(/\D/g, ''); // Loại bỏ tất cả các ký tự không phải là số
    const total_price = parseFloat(total_price_str);
    if (total_price < 0) {
        alert("Tổng tiền không được âm.");
        return false;
    }
   

    return true;
};

const handleFetchData = async () => {
    try {
        const total_price_str = totalPrice.innerText.replace(/\D/g, ''); // Loại bỏ tất cả các ký tự không phải là số
        const total_price = parseFloat(total_price_str);
        const data = {
            checkIn: dateInput.value,
            checkOut: dateOutput.value,
            total_price: total_price,
            rooms: [],
        };

        const roomSelectItems =
            roomSelectItemList.querySelectorAll(".room_select_item");

        roomSelectItems.forEach((roomSelectItem) => {
            data.rooms.push({
                roomCategoryId: roomSelectItem.dataset.id,
                quantity: roomSelectItem.dataset.number,
            });
        });

        const res = await fetch("/roomBooking", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        alert("Đặt phòng thành công");
    } catch (error) {
        console.log(error);
    }
};

// -------------------------- xử lý cho ui-------------------------

roomItems.forEach((roomItem) => {
    const item = JSON.parse(roomItem.dataset.item);
    console.log(item);
    const roomNumber = roomItem.querySelector(".room-number");
    roomNumber.onchange = (e) => {
        const value = Number(e.target.value);
        if (!Number.isInteger(value) ) {
            alert("Số phòng phải là số nguyên dương");
            e.target.value = 0; // Reset to a valid value
            return;
        }

        roomSelectItemList
            .querySelector(`.room_select_item[data-id='${item.id}'`)
            ?.remove();

        if (+value > 0) {
            const roomSelectItem = createRoomSelectItem(item, value);

            roomSelectItemList.innerHTML =
                roomSelectItemList.innerHTML + roomSelectItem;
        }
        caculateTotal();
    };
});
const formatDate = (dateString) => {
    const dateParts = dateString.split('-');
    if (dateParts.length === 3) {
      const [year, month, day] = dateParts;
      return `${day}-${month}-${year}`;
    } else {
      return dateString; // Trả về ngày không thay đổi nếu không thành công
    }
  };

  
dateInput.onchange = (e) => {
    checkInValue.innerHTML = formatDate(e.target.value) ;
};

dateOutput.onchange = (e) => {
    checkOutValue.innerHTML = formatDate(e.target.value);
};
// Xử lý sự kiện khi thay đổi ngày nhận phòng
dateInput.addEventListener('change', () => {
    handleDateValidation();
    caculateTotal(); // Cập nhật lại tổng tiền sau khi thay đổi ngày
});

// Thêm sự kiện onchange cho input ngày checkout để kiểm tra ngày nhập vào và cập nhật thông tin đặt phòng
dateOutput.addEventListener('change', () => {
    handleDateValidation();
    caculateTotal(); // Cập nhật lại tổng tiền sau khi thay đổi ngày
});
async function fetchAvailableRooms(checkin, checkout) {
    try {
        const response = await fetch(`/admin/api/getAvailableRooms?startDate=${checkin}&endDate=${checkout}`);
        const data = await response.json();
        return data.availableRoomCounts;
    } catch (error) {
        console.error('Error fetching available rooms:', error);
        return {};
    }
}
// Update the room list in the DOM
function updateRoomList(availableRoomCounts) {
    const roomItems = document.querySelectorAll('.room_item');
    roomItems.forEach(roomItem => {
        const item = JSON.parse(roomItem.dataset.item);
        const availableCount = availableRoomCounts[item.id] || 0;
        const availableCountElement = roomItem.querySelector('.available-count');
        availableCountElement.textContent = availableCount;
    });
}
// Add event listeners to date inputs to fetch and update room data on change
document.querySelectorAll('.dateInput').forEach(dateInput => {
    dateInput.addEventListener('change', async function () {
        const checkin = document.querySelector('input[name="checkin"]').value;
        const checkout = document.querySelector('input[name="checkout"]').value;
        if (checkin && checkout) {
            const availableRoomCounts = await fetchAvailableRooms(checkin, checkout);
            updateRoomList(availableRoomCounts);
        }
    });
});
document.querySelectorAll('.dateOutput').forEach(dateOutput => {
    dateOutput.addEventListener('change', async function () {
        const checkin = document.querySelector('input[name="checkin"]').value;
        const checkout = document.querySelector('input[name="checkout"]').value;
        if (checkin && checkout) {
            const availableRoomCounts = await fetchAvailableRooms(checkin, checkout);
            updateRoomList(availableRoomCounts);
        }
    });
});

// Xử lý logic số phòng đặt phải nhỏ hơn hoặc bằng số phòng còn trống
const handleRoomCountValidation = () => {
    const roomItems = document.querySelectorAll('.room_item');
    roomItems.forEach(roomItem => {
        const roomNumberInput = roomItem.querySelector('.room-number');
        const availableCount = parseInt(roomItem.querySelector('.available-count').textContent);
        const selectedCount = parseInt(roomNumberInput.value);
        if (selectedCount > availableCount) {
            alert(`Số phòng đặt không được lớn hơn số phòng còn trống (${availableCount}).`);
            roomNumberInput.value = availableCount;
        }
    });
};

// Thêm sự kiện onchange cho input số lượng phòng để kiểm tra số phòng đặt
roomItems.forEach(roomItem => {
    const roomNumberInput = roomItem.querySelector('.room-number');
    roomNumberInput.addEventListener('change', handleRoomCountValidation);
});

// Xử lý logic ngày nhập vào: nếu nhập checkout trước, thì checkin chỉ được nhập những ngày bé hơn ngày checkout
const handleDateValidation = () => {
    const checkinDate = new Date(dateInput.value);
    const checkoutDate = new Date(dateOutput.value);
    if (checkoutDate < checkinDate) {
        alert("Ngày checkin phải trước ngày checkout.");
        dateInput.value = ""; // Reset checkin date
    }
    checkInValue.innerHTML = formatDate(dateInput.value);
};

// Thêm sự kiện onchange cho input ngày checkin để kiểm tra ngày nhập vào
dateInput.addEventListener('change', handleDateValidation);



// Thay đổi xử lý sự kiện click cho nút submit
$(document).ready(function () {
    $('.submit-button').on('click', function () {
        if (!handleValidateData()) {
            return;
        }
        confirmBooking();
    });

    $('#paymentMethod').off('change').on('change', function () {
        selectedPaymentMethod = this.value;
        $('.modal').modal('hide');
    });

    $('.confirmPaymentButton').off('click').on('click', function () {
        handlePayment();
    });

    $('.cancelBooking').off('click').on('click', function () {
        if (confirm("Bạn có chắc chắn muốn hủy đơn đặt phòng không?")) {
            cancelBooking();
            $('.modal').modal('hide'); // Đóng tất cả các modal khi hủy
        }
    });
});

document.getElementById("paymentMethod").addEventListener("change", function() {
    selectedPaymentMethod = this.value;
});
const confirmBooking = () => {
    if (!handleValidateData()) {
        return;
    }

    const selectedMethod = paymentMethod.value;
    if (!selectedMethod) {
        alert("Vui lòng chọn phương thức thanh toán.");
        return;
    }

    $('.modal').modal('hide'); // Hide all modals first

    if (selectedMethod === 'creditCard') {
        $('#creditCardModal').modal('show');
    } else if (selectedMethod === 'bankTransfer') {
        $('#bankTransferModal').modal('show');
    } else if (selectedMethod === 'QR') {
        $('#qrCodeModal').modal('show');
    }
};

const handlePayment = () => {
    handleFetchData().then(() => {
        // Đóng tất cả các modal
        $('.modal').modal('hide');
        // Đặt lại các giá trị
        cancelBooking();
    });
};
const cancelBooking = () => {
    window.location.reload();
};

