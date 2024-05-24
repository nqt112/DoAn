const roomItems = document.querySelectorAll(".room_list .room_item");
const roomSelectItemList = document.querySelector(".room_select_item_list");
const totalPrice = document.querySelector(".total-price");
const checkInValue = document.querySelector(".check-in-value");
const checkOutValue = document.querySelector(".check-out-value");
const dateInput = document.querySelector(".dateInput");
const dateOutput = document.querySelector(".dateOutput");
const submitButton = document.querySelector(".submit-button");

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

const caculateTotal = () => {
    let total = 0;

    const roomSelectItems = roomSelectItemList.querySelectorAll(".room_select_item");
    const checkInDate = new Date(dateInput.value);
    const checkOutDate = new Date(dateOutput.value);
    const numberOfDays = Math.ceil((checkOutDate - checkInDate) / (1000 * 3600 * 24)); // Số ngày thuê

    roomSelectItems.forEach((roomSelectItem) => {
        const pricePerNight = Number(roomSelectItem.querySelector(".price").innerHTML);
        const numberOfRooms = roomSelectItem.dataset.number;
        total += pricePerNight * numberOfRooms * numberOfDays;
    });

    totalPrice.innerHTML = moneyFormat(total);
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
dateInput.addEventListener('change', caculateTotal);

// Xử lý sự kiện khi thay đổi ngày trả phòng
dateOutput.addEventListener('change', caculateTotal);

submitButton.onclick = () => {
    if (!handleValidateData()) {
        return;
    }
    if (confirm("Xác nhận đặt phòng!")) {
        handleFetchData(); // Nếu người dùng chọn "OK", gọi hàm xử lý đặt phòng
    } else {
        // Nếu người dùng chọn "Cancel", không làm gì cả hoặc có thể hiển thị thông báo khác
    }
    // handleFetchData();
};
