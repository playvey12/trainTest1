class DaySelectorModal {
  constructor() {
    
    this.modal = document.getElementById("day-modal");

    if (!this.modal) {
      console.error("Modal element not found!");
      return;
    }

    this.closeBtn = this.modal.querySelector(".close-btn");
    this.dayCards = this.modal.querySelectorAll(".day-card");
    this.confirmBtn = document.getElementById("confirm-day-btn");
    this.startBtn = document.getElementById("start-workout-btn");

    this.selectedDay = null;

 

    this.init();
  }

  init() {
   
    if (this.startBtn) {
      this.startBtn.addEventListener("click", (e) => {
        e.preventDefault();

        this.openModal();
      });
    }

   
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.closeModal());
    }

    window.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });


    this.dayCards.forEach((card) => {
      card.addEventListener("click", () => this.selectDay(card));
    });

    if (this.confirmBtn) {
      this.confirmBtn.addEventListener("click", () => this.startTraining());
    }
  }

  selectDay(card) {
    
    this.dayCards.forEach((c) => c.classList.remove("selected"));

    
    card.classList.add("selected");
    this.selectedDay = card.dataset.day;

   
    this.confirmBtn.disabled = false;
  }

  startTraining() {
    if (!this.selectedDay) {
      return;
    }


    const russianDays = {
      Monday: "Понедельник",
      Tuesday: "Вторник",
      Wednesday: "Среда",
      Thursday: "Четверг",
      Friday: "Пятница",
      Saturday: "Суббота",
      Sunday: "Воскресенье",
    };

    const russianDayName = russianDays[this.selectedDay] || this.selectedDay;


    if (window.trainingLazyLoader) {
      window.trainingLazyLoader.showExercisesForDay(this.selectedDay);
    } else {
    }


    const title = document.querySelector("header h1");
    if (title) {
      title.textContent = `Тренировка: ${russianDayName}`;
    }


    if (this.startBtn) {
      this.startBtn.textContent = "Сменить день";
      this.startBtn.dataset.mode = "change";

     
      this.startBtn.onclick = (e) => {
        e.preventDefault();
        this.resetTraining();
      };
    }

   
    localStorage.setItem("selectedTrainingDay", this.selectedDay);


    this.closeModal();
  }

  resetTraining() {
 
    if (window.trainingLazyLoader) {
      window.trainingLazyLoader.resetToInitialState();
    }

 
    const title = document.querySelector("header h1");
    if (title) {
      title.textContent = "Тренировка";
    }

  
    if (this.startBtn) {
      this.startBtn.textContent = "Начать тренировку";
      this.startBtn.dataset.mode = "start";


      this.startBtn.onclick = (e) => {
        e.preventDefault();
        this.openModal();
      };
    }

   
    localStorage.removeItem("selectedTrainingDay");

   
    this.openModal();
  }

  openModal() {
    this.modal.style.display = "block";
  }

  closeModal() {
    this.modal.style.display = "none";


    this.dayCards.forEach((c) => c.classList.remove("selected"));
    this.selectedDay = null;

 
    this.confirmBtn.disabled = true;
  }
}


document.addEventListener("DOMContentLoaded", () => {

  setTimeout(() => {
    const modal = new DaySelectorModal();
    window.daySelectorModal = modal;

   
    const savedDay = localStorage.getItem("selectedTrainingDay");
    if (savedDay && window.trainingLazyLoader) {
     
      const russianDays = {
        Monday: "Понедельник",
        Tuesday: "Вторник",
        Wednesday: "Среда",
        Thursday: "Четверг",
        Friday: "Пятница",
        Saturday: "Суббота",
        Sunday: "Воскресенье",
      };

      const title = document.querySelector("header h1");
      if (title && russianDays[savedDay]) {
        title.textContent = `Тренировка: ${russianDays[savedDay]}`;
      }

   
      const startBtn = document.getElementById("start-workout-btn");
      if (startBtn) {
        startBtn.textContent = "Сменить день";
        startBtn.dataset.mode = "change";
        startBtn.onclick = (e) => {
          e.preventDefault();
          window.daySelectorModal.resetTraining();
        };
      }

      
      window.trainingLazyLoader.showExercisesForDay(savedDay);
    }
  }, 100);
});
