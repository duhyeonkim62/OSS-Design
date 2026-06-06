class User {
    constructor(userId, name) {
        this.userId = userId;
        this.name = name;
    }
}

class Seat {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.reservation = null;
    }
    reserve() { this.reservation = new Reservation(this); }
    cancel() { this.reservation = null; }
    isReserved() { return this.reservation !== null; }
}

class Reservation {
    constructor(seat) {
        this.seat = seat;
        this.remainingTime = 3600;
        this.startTime = new Date();
    }
    getEndTime() {
        let endTime = new Date(this.startTime.getTime() + (this.remainingTime * 1000));
        return endTime.toLocaleTimeString();
    }
    getTotalUsedTime() {
        let now = new Date();
        return Math.floor((now - this.startTime) / 1000);
    }
    extendTime() {
        if (this.remainingTime + 1800 <= 10800) {
            this.remainingTime += 1800;
            return true;
        }
        return false;
    }
    decreaseTime() { this.remainingTime--; }
}

class SeatManager {
    constructor() {
        this.seats = Array.from({length: 30}, (_, r) => 
            Array.from({length: 30}, (_, c) => new Seat(r, c)));
    }
    getSeat(r, c) { return this.seats[r][c]; }
}

class ReservationManager {
    reserve(seat) {
        if (seat.isReserved()) return false;
        seat.reserve();
        return true;
    }
    cancel(seat) { seat.cancel(); }
}

class TimerManager {
    constructor() { this.timer = null; }
    start(callback) { this.timer = setInterval(callback, 1000); }
}

class SeatEasilyApp {
    constructor() {
        this.seatManager = new SeatManager();
        this.reservationManager = new ReservationManager();
        this.timerManager = new TimerManager();
        this.selectedSeat = null;
        this.container = document.getElementById("seatContainer");
    }

    startApp() {
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("appScreen").style.display = "block";
        this.init();
    }

    init() {
        for (let r = 0; r < 30; r++) {
            for (let c = 0; c < 30; c++) {
                const seatDiv = document.createElement("div");
                seatDiv.className = "seat available";
                seatDiv.onclick = () => this.selectSeat(r, c);
                this.container.appendChild(seatDiv);
            }
        }
        this.loadData();
        this.timerManager.start(() => this.updateAll());
    }

    selectSeat(r, c) {
        this.selectedSeat = this.seatManager.getSeat(r, c);
        document.querySelectorAll(".seat").forEach(x => x.classList.remove("selected"));
        this.container.children[r * 30 + c].classList.add("selected");
        this.updateInfo();
    }

    reserve() {
        if (!this.selectedSeat) return alert("좌석을 선택하세요.");
        if (this.reservationManager.reserve(this.selectedSeat)) {
            alert("예약 완료");
            this.saveData();
            this.updateAll();
        } else {
            alert("이미 예약된 좌석입니다.");
        }
    }

    cancel() {
        if (!this.selectedSeat || !this.selectedSeat.isReserved()) return alert("취소할 예약이 없습니다.");
        this.reservationManager.cancel(this.selectedSeat);
        alert("예약이 취소되었습니다.");
        this.saveData();
        this.updateAll();
    }

    extend() {
        if (!this.selectedSeat || !this.selectedSeat.isReserved()) return alert("연장할 예약이 없습니다.");
        if (this.selectedSeat.reservation.extendTime()) {
            alert("시간이 연장되었습니다.");
            this.saveData();
            this.updateInfo();
        } else {
            alert("최대 시간 초과.");
        }
    }

    updateAll() {
        for (let r = 0; r < 30; r++) {
            for (let c = 0; c < 30; c++) {
                let seat = this.seatManager.getSeat(r, c);
                if (seat.isReserved()) {
                    seat.reservation.decreaseTime();
                    if (seat.reservation.remainingTime <= 0) seat.cancel();
                }
            }
        }
        this.refreshUI();
        this.updateInfo();
    }

    refreshUI() {
        const divs = this.container.children;
        for (let i = 0; i < 900; i++) {
            let seat = this.seatManager.getSeat(Math.floor(i / 30), i % 30);
            divs[i].className = "seat " + (seat.isReserved() ? "reserved" : "available");
            if (this.selectedSeat === seat) divs[i].classList.add("selected");
        }
    }

    updateInfo() {
        const seatNumber = document.getElementById("seatNumber");
        const startTime = document.getElementById("startTime");
        const remainingTime = document.getElementById("remainingTime");
        const endTimeEl = document.getElementById("endTime");
        const usedTimeEl = document.getElementById("usedTime");

        if (!this.selectedSeat || !this.selectedSeat.isReserved()) {
            seatNumber.textContent = this.selectedSeat ? `${this.selectedSeat.row + 1}-${this.selectedSeat.col + 1}` : "없음";
            startTime.textContent = "-";
            remainingTime.textContent = "0분 0초";
            endTimeEl.textContent = "-";
            usedTimeEl.textContent = "0분 0초";
        } else {
            let r = this.selectedSeat.reservation;
            seatNumber.textContent = `${r.seat.row + 1}-${r.seat.col + 1}`;
            startTime.textContent = r.startTime.toLocaleTimeString();
            remainingTime.textContent = `${Math.floor(r.remainingTime / 60)}분 ${r.remainingTime % 60}초`;
            endTimeEl.textContent = r.getEndTime();
            let used = r.getTotalUsedTime();
            usedTimeEl.textContent = `${Math.floor(used / 60)}분 ${used % 60}초`;
        }
    }

    saveData() {
        let seatData = [];
        for (let r = 0; r < 30; r++) {
            for (let c = 0; c < 30; c++) {
                let seat = this.seatManager.getSeat(r, c);
                if (seat.isReserved()) {
                    seatData.push({ r, c, remainingTime: seat.reservation.remainingTime, startTime: seat.reservation.startTime });
                }
            }
        }
        localStorage.setItem("seatReservationData", JSON.stringify(seatData));
    }

    loadData() {
        let saved = localStorage.getItem("seatReservationData");
        if (!saved) return;
        let seatData = JSON.parse(saved);
        seatData.forEach(data => {
            let seat = this.seatManager.getSeat(data.r, data.c);
            seat.reserve();
            seat.reservation.remainingTime = data.remainingTime;
            seat.reservation.startTime = new Date(data.startTime);
        });
    }
}

const app = new SeatEasilyApp();

function loginAsGuest() { app.startApp(); }
function reserveSeat() { app.reserve(); }
function cancelSeat() { app.cancel(); }
function extendTime() { app.extend(); }