var dateInputs = document.getElementsByClassName("dateInput");

// Lấy tất cả các phần tử có class là "dateOutput"
var dateOutputs = document.getElementsByClassName("dateOutput");
// Lấy ngày hiện tại
var today = new Date();
var dd = String(today.getDate()).padStart(2, "0");
var mm = String(today.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0
var yyyy = today.getFullYear();
var todayString = yyyy + "-" + mm + "-" + dd;

// Thiết lập giá trị tối thiểu cho các input
for (var i = 0; i < dateInputs.length; i++) {
  dateInputs[i].setAttribute("min", todayString);
}

// Kiểm tra khi có sự thay đổi trong input
for (var i = 0; i < dateInputs.length; i++) {
  dateInputs[i].addEventListener("change", function () {
    var selectedDate = new Date(this.value); // Ngày được chọn trong dateInput
    var dd = String(selectedDate.getDate()).padStart(2, "0");
    var mm = String(selectedDate.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0
    var yyyy = selectedDate.getFullYear();
    var selectedDateString = yyyy + "-" + mm + "-" + dd;

    // Hiển thị ngày đã chọn trong phần tử dateOutput
    for (var j = 0; j < dateOutputs.length; j++) {
      dateOutputs[j].innerText = "Ngày đã chọn: " + selectedDateString;
      dateOutputs[j].setAttribute("min", selectedDateString); // Giới hạn dateOutput từ ngày được chọn
    }
  });
}

// Hàm cập nhật ngày tháng hiện tại theo thời gian thực
function updateDateTime() {
  var now = new Date();
  var options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  var formattedDateTime = now.toLocaleDateString("vi-VN", options);
  document.getElementById("current-date-time").textContent = formattedDateTime;
}

// Cập nhật ngày tháng hiện tại ngay khi trang được tải
updateDateTime();
// Cập nhật ngày tháng hiện tại mỗi giây
setInterval(updateDateTime, 1000);


$(document).ready(function () {

  const fetchRooms = (page = 1) => {
    const floor = $("#floor-filter").val();
    const status = $("#status-filter").val();
    const search = $("#search").val(); // Lấy giá trị tìm kiếm từ ô input
    const startDate = $("#start-date").val(); // Lấy giá trị ngày bắt đầu
    const endDate = $("#end-date").val(); // Lấy giá trị ngày kết thúc
    const url = `/admin/api/dayRoomStatus?page=${page}&floor=${floor}&status=${status}&search=${search}&startDate=${startDate}&endDate=${endDate}`;
    // Thêm vào đoạn mã JavaScript đã có
    const dayRoomStatus = {
      CONTRONG: "Còn trống",
      DADAT: "Đã được đặt",
  };
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const rooms = data.rooms;
        const total = data.total;
        const roomsContainer = document.getElementById("rooms-container");
        roomsContainer.innerHTML = "";
        
        rooms.forEach((room) => {
          let cardClass = "";
          let statusText = room.Status;
          if (room.Status === dayRoomStatus.CONTRONG ) {
            cardClass = "bg-success";
          } else {
            cardClass = "bg-danger";
            statusText = "";
          }

          const roomCard = `
        <div class="col">
          <div class="card h-100 ${cardClass}">
            <div class="card-header bg-primary text-white d-flex align-items-center justify-content-center">${
              room.RoomName
            }</div>
            <div class="text-white d-flex align-items-center justify-content-center flex-column" style="height: 100%;">
              <div class="text-center">${statusText}</div>
              ${
                room.CustomerName
                  ? `<div class="text-center">${room.CustomerName}</div>`
                  : ""
              }
              ${
                room.Checkin
                  ? `<div class="text-center">Checkin: ${room.Checkin}</div>`
                  : ""
              }
              ${
                room.Checkout
                  ? `<div class="text-center">Checkout: ${room.Checkout}</div>`
                  : ""
              }
            </div>
          </div>
        </div>
      `;
          roomsContainer.insertAdjacentHTML("beforeend", roomCard);
        });

        // Thêm logic phân trang
        const paginationContainer = document.getElementById(
          "pagination-container"
        );
        paginationContainer.innerHTML = "";
        const totalPages = Math.ceil(total / 15);
        for (let i = 1; i <= totalPages; i++) {
          const pageButton = `<button class="m-1 btn btn-secondary pagination-btn" data-page="${i}">${i}</button>`;
          paginationContainer.insertAdjacentHTML("beforeend", pageButton);
        }
      })
      .catch((error) => {
        console.error("Error fetching rooms:", error);
      });
  };

  $("#floor-filter").on("change", () => fetchRooms());
  $("#status-filter").on("change", () => fetchRooms());
  $("#search-btn").on("click", () => fetchRooms());
  $("#start-date, #end-date").on("change", () => fetchRooms());
  $("#search").on("change", () => fetchRooms());

  $(document).on("click", ".pagination-btn", function () {
    const page = $(this).data("page");
    fetchRooms(page);
  });

  // Reset filters
  $("#reset-filters-btn").on("click", function () {
    $("#floor-filter").val("all");
    $("#status-filter").val("all");
    $("#search").val("");
    $("#start-date").val("");
    $("#end-date").val("");
    fetchRooms(); // Fetch rooms with default values
  });

  fetchRooms();
});

