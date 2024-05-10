// Lấy phần tử cần ẩn
var selectElement = document.querySelector("select.nice-select");
// Đặt thuộc tính style để ẩn phần tử
selectElement.style.display = "block";
var selectElement = document.querySelector("div.nice-select");
// Đặt thuộc tính style để ẩn phần tử
selectElement.style.display = "none";

$("#closeModalButton").click(function () {
  // Đóng modal
  $("#exampleModal").modal("hide");
});
$(".detail-button").click(function () {
  // Lấy id của đơn đặt từ thuộc tính data-booking-id của nút "Chi tiết"
  var id = $(this).data("booking-id");

  // Gửi yêu cầu Ajax để lấy thông tin phòng tương ứng với đơn đặt
  $.ajax({
    url: "/bookingDetail/" + id, // Đường dẫn API hoặc route để lấy thông tin phòng
    type: "GET",
    success: function (response) {
      // Xử lý phản hồi JSON từ server
      // Ví dụ: giả sử phản hồi trả về một mảng các phòng, bạn có thể thêm chúng vào modal
      var modalContent = "";

      response.forEach(function (room) {
        modalContent += "<tr>";
        modalContent += "<td>" + room.Room_category.name + "</td>";
        modalContent += "<td>" + room.Room_category.numberOfPeople + "</td>";
        modalContent += "<td>" + room.price + "</td>";
        modalContent += "<td>" + room.quantity + "</td>";
        // Thêm các dòng khác tương ứng với các thuộc tính của phòng
        modalContent += "</tr>";
      });
      // Thêm nội dung vào modal
      $("#detail_room_list").html(modalContent);
      // Mở modal
      $("#exampleModal").modal("show");
    },
    error: function (xhr, status, error) {
      console.error(error);
      // Xử lý lỗi nếu cần
    },
  });
});

$(document).ready(function () {
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
  // Khai báo biến để lưu tổng số tiền
  var totalAmount = 0;

  $(".openOrderServiceModal").click(function () {
    // Lấy data-booking-id từ nút được bấm
    var bookingId = $(this).data("booking-id");
    // Gán giá trị data-booking-id vào modal
    $("#order-service-modal").data("booking-id", bookingId);

    $("#order-service-modal").modal("show");
  });

  $("#closeServiceModal").click(function () {
    $("#order-service-modal").modal("hide");
  });

  // Sự kiện click cho nút "Xoá"
  // Sự kiện click cho nút "Xoá"
  $(document).on("click", ".delete-service-btn", function () {
    // Xác định hàng (tr) chứa nút "Xoá"
    var row = $(this).closest("tr");
    // Lấy giá trị của dịch vụ bị xóa để trừ đi từ tổng số tiền
    var serviceName = row.find("td:first").text();
    // var price = parseFloat(row.find(".service-price").text());
    var price = row.find(".service-price").text(); // Lấy giá trị từ selector
    var count = parseFloat(row.find(".service-count").text());
    totalAmount -= price * count;
    // Cập nhật lại tổng số tiền
    $("#total-amount").text(moneyFormat(totalAmount));
    // Xoá hàng đó khỏi DOM
    row.remove();

    // Cập nhật lại mảng selectedServices bằng cách loại bỏ dịch vụ đã xoá
    selectedServices = selectedServices.filter(function (service) {
      return service.service !== serviceName;
    });
    updateSelectedServicesList();
  });

  $.ajax({
    url: "/api/serviceList",
    type: "GET",
    success: function (response) {
      // Xử lý phản hồi JSON từ máy chủ và tạo các tùy chọn cho dropdownlist
      response.forEach(function (service) {
        $("#service-dropdown").append(
          "<option value='" + service.id + "'>" + service.name + "</option>"
        );
      });
    },
    error: function (xhr, status, error) {
      console.error(error);
      // Xử lý lỗi nếu cần
    },
  });

  // Mảng lưu trữ các dịch vụ đã chọn
  var selectedServices = [];
  //Xử lý sự kiện thêm
  $("#add-service-btn").click(function () {
    var selectedServiceName = $("#service-dropdown option:selected").text();
    var quantity = parseInt($("#quantity").val()); // Chuyển đổi số lượng sang kiểu số nguyên

    // Lấy thông tin dịch vụ từ API để có giá cả
    var selectedServiceId = $("#service-dropdown").val();
    $.ajax({
      url: "/api/serviceList",
      type: "GET",
      success: function (response) {
        var existingService = selectedServices.find(function (service) {
          return service.id == selectedServiceId;
        });

        if (existingService) {
          // Nếu dịch vụ đã được chọn trước đó, tăng số lượng
          existingService.quantity += quantity;
        } else {
          // Nếu chưa được chọn trước đó, thêm mới vào mảng selectedServices
          response.forEach(function (item) {
            if (item.id == selectedServiceId) {
              selectedServices.push({
                id: selectedServiceId,
                service: selectedServiceName,
                quantity: quantity,
                price: item.price,
              });
            }
          });
        }
        // Cập nhật lại danh sách dịch vụ đã chọn và tổng số tiền
        updateSelectedServicesList();
      },
      error: function (xhr, status, error) {
        console.error(error);
        // Xử lý lỗi nếu cần
      },
    });

    // Đặt lại giá trị của dropdown và số lượng về mặc định
    $("#service-dropdown").val($("#service-dropdown option:first").val());
    $("#quantity").val("1");
  });

  // Hàm cập nhật lại danh sách dịch vụ đã chọn và tổng số tiền
  function updateSelectedServicesList() {
    // Xóa hết dữ liệu cũ trong danh sách
    $("#selected-services-list").empty();
    // Khởi tạo biến để tính tổng số tiền mới
    var newTotalAmount = 0;

    // Duyệt qua mảng selectedServices để hiển thị dữ liệu mới và tính tổng số tiền mới
    selectedServices.forEach(function (service) {
      $("#selected-services-list").append(
        "<tr><td>" +
          service.service +
          "</td><td class='service-count'>" +
          service.quantity +
          "</td><td class='service-price'>" +
          moneyFormat(service.price) +
          "</td><td><button type='button' class='btn btn-danger delete-service-btn'><i class='ti ti-trash'></i></button></td></tr>"
      );
      newTotalAmount += service.price * service.quantity;
    });

    // Cập nhật tổng số tiền với giá trị mới tính toán
    totalAmount = newTotalAmount;
    $("#total-amount").text(moneyFormat(totalAmount));
  }

  // Sự kiện khi nút "Xác nhận đặt dịch vụ" được nhấn
  // Sự kiện khi nút "Xác nhận đặt dịch vụ" được nhấn
  $("#confirm-order-btn").click(async function () {
    try {
      if (selectedServices.length === 0) {
        alert("Vui lòng chọn ít nhất một dịch vụ trước khi xác nhận đặt!");
        return; // Dừng việc thực hiện tiếp theo nếu không có dịch vụ nào được chọn
      }
      // Lấy totalPrice từ phần tử có id là total-amount
      // const totalPriceText = $("#total-amount").text();
      // Loại bỏ ký tự không phải số từ chuỗi và chuyển đổi sang kiểu số
      // const totalPrice = parseFloat(totalPriceText.replace(/\D/g, ''));
      // Thu thập thông tin đặt dịch vụ từ giao diện người dùng
      const bookingId = $("#order-service-modal").data("booking-id");
      // const selectedServicesData = [];
      // Tạo object chứa thông tin đặt dịch vụ
      const bookingData = {
        services: [],
      };

      // Duyệt qua mỗi dịch vụ đã chọn
      selectedServices.forEach(function (service) {
        const serviceId = service.id;
        const quantity = service.quantity;
        const pricePerUnit = service.price; // Giá của mỗi đơn vị dịch vụ

        // Tính giá của dịch vụ dựa trên số lượng
        const totalPriceForService = quantity * pricePerUnit;

        // Thêm thông tin dịch vụ vào mảng services
        bookingData.services.push({
          bookingId: bookingId,
          serviceId: serviceId,
          quantity: quantity,
          total_price: totalPriceForService, // Giá của dịch vụ dựa trên số lượng
        });
      });

      // Gọi hàm postBookingService để lưu thông tin đặt dịch vụ lên cơ sở dữ liệu
      const res = await fetch("/api/bookingService", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });
      selectedServices = [];
      updateSelectedServicesList();
      
      alert("Đặt dịch vụ thành công!");
      
      // Xử lý phản hồi từ server nếu cần
      $("#order-service-modal").modal("hide");
      console.log(response); // In ra phản hồi từ server
      // Đóng modal sau khi đặt dịch vụ thành công
    } catch (error) {
      console.error(error); // Xử lý lỗi nếu có
    }
  });
});
