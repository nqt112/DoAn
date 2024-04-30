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
    const formatter = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    });

    return formatter.format(money);
};

const caculateTotal = () => {
    let total = 0;

    const roomSelectItems =
        roomSelectItemList.querySelectorAll(".room_select_item");
    roomSelectItems.forEach((roomSelectItem) => {
        total +=
            Number(roomSelectItem.querySelector(".price").innerHTML) *
            roomSelectItem.dataset.number;
    });

    totalPrice.innerHTML = moneyFormat(total * 1000);
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
          <img src="/image/uploadFile/${item.image}" alt="" width="150" height="100">
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
        alert("bạn phải nhập check in");
        return false;
    }
    if (!dateOutput.value) {
        alert("bạn phải nhập check out");
        return false;
    }
    const roomSelectItemsCount =
        roomSelectItemList.querySelectorAll(".room_select_item").length;
    if (roomSelectItemsCount < 1) {
        alert("bạn phải chọn ít nhất 1 phòng");
        return false;
    }
    return true;
};

const handleFetchData = async () => {
    try {
        const data = {
            checkIn: dateInput.value,
            checkOut: dateOutput.value,
            rooms: [],
        };

        const roomSelectItems =
            roomSelectItemList.querySelectorAll(".room_select_item");

        roomSelectItems.forEach((roomSelectItem) => {
            data.rooms.push({
                roomId: roomSelectItem.dataset.id,
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
        const value = e.target.value;
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

dateInput.onchange = (e) => {
    checkInValue.innerHTML = e.target.value;
};

dateOutput.onchange = (e) => {
    checkOutValue.innerHTML = e.target.value;
};

submitButton.onclick = () => {
    if (!handleValidateData()) {
        return;
    }
    handleFetchData();
};
