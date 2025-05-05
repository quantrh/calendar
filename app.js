
let bookings = [];
let meta = {};
const roomSelect = document.getElementById('roomSelect');
const groupSelect = document.getElementById('groupSelect');
const bookingForm = document.getElementById('bookingForm');
const bookingTable = document.getElementById('bookingTable').querySelector('tbody');
const tabs = document.querySelectorAll('.tab');

function showTab(tabId) {
  tabs.forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  if (tabId === 'calendarTab') {
    renderCalendarView();
  } else if (tabId === 'layoutViewTab') {
    renderRoomLayout();
  }
}

function loadMeta() {
  fetch('meta.json')
    .then(res => res.json())
    .then(data => {
      meta = data;
      data.rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room;
        option.textContent = room;
        roomSelect.appendChild(option);
      });
      data.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        groupSelect.appendChild(option);
      });
    });
}

function loadBookings() {
  fetch('bookings.json')
    .then(res => res.json())
    .then(data => {
      bookings = data;
      renderBookings();
    });
}

function renderBookings() {
  bookingTable.innerHTML = '';
  bookings.forEach((b, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${b.room}</td><td>${b.group}</td><td>${b.date}</td>
                     <td>${b.startTime}</td><td>${b.endTime}</td><td>${b.purpose}</td>
                     <td><button onclick="deleteBooking(${index})">Xóa</button></td>`;
    bookingTable.appendChild(row);
  });
}

function deleteBooking(index) {
  if (confirm('Bạn có chắc chắn muốn xóa đặt phòng này?')) {
    bookings.splice(index, 1);
    renderBookings();
    renderCalendarView();
    renderRoomLayout();
  }
}

bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const booking = {
    room: roomSelect.value,
    group: groupSelect.value,
    date: document.getElementById('dateInput').value,
    startTime: document.getElementById('startTime').value,
    endTime: document.getElementById('endTime').value,
    purpose: document.getElementById('purpose').value
  };

  const conflict = bookings.some(b => b.room === booking.room && b.date === booking.date &&
    ((booking.startTime >= b.startTime && booking.startTime < b.endTime) ||
     (booking.endTime > b.startTime && booking.endTime <= b.endTime)));
  if (conflict) {
    alert('Thời gian bị trùng với lịch đã đặt!');
    return;
  }

  bookings.push(booking);
  renderBookings();
  renderCalendarView();
  renderRoomLayout();
  bookingForm.reset();
});

function exportData() {
  const data = { bookings, meta };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'booking_data.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const file = document.getElementById('importFile').files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = JSON.parse(e.target.result);
    bookings = data.bookings || [];
    meta = data.meta || {};
    renderBookings();
    renderCalendarView();
    renderRoomLayout();
  };
  reader.readAsText(file);
}

function renderCalendarView() {
  const calendarEl = document.getElementById('fullCalendar');
  calendarEl.innerHTML = '';
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'vi',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    events: bookings.map((b, index) => ({
      id: String(index),
      title: `${b.group} - ${b.purpose}`,
      start: `${b.date}T${b.startTime}`,
      end: `${b.date}T${b.endTime}`,
      backgroundColor: b.room === 'Hà Nội' ? '#007bff' : '#28a745',
      borderColor: b.room === 'Hà Nội' ? '#007bff' : '#28a745'
    })),
    eventClick: function(info) {
      const b = bookings[parseInt(info.event.id)];
      alert(`Phòng: ${b.room}\nNhóm: ${b.group}\nThời gian: ${b.startTime} - ${b.endTime}\nMục đích: ${b.purpose}`);
    }
  });
  calendar.render();
}

function renderRoomLayout() {
  const grid = document.getElementById("roomGrid");
  grid.innerHTML = "";
  const allRooms = meta.rooms || ['Hà Nội', 'HCM'];
  allRooms.forEach(room => {
    const roomBookings = bookings.filter(b => b.room === room);
    const card = document.createElement("div");
    card.className = "room-card";
    let content = `<h3>${room}</h3>`;
    if (roomBookings.length === 0) {
      card.classList.add("trong");
      content += `<small>Trống</small>`;
    } else {
      const latest = roomBookings[roomBookings.length - 1];
      const now = new Date();
      const start = new Date(latest.date + "T" + latest.startTime);
      const end = new Date(latest.date + "T" + latest.endTime);
      if (now >= start && now <= end) {
        card.classList.add("occupied");
        content += `<small>Đang họp</small><small>${latest.group}</small><small>${latest.purpose}</small>`;
      } else {
        card.classList.add("booked");
        content += `<small>Đã đặt</small><small>${latest.group}</small><small>${latest.purpose}</small>`;
      }
    }
    content += `<small><a href="#">View</a></small>`;
    card.innerHTML = content;
    grid.appendChild(card);
  });
}

loadMeta();
loadBookings();
