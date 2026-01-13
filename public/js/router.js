// router.js с поддержкой токена в URL
function resetUrl() {
  const token = localStorage.getItem('token') || getTokenFromUrl();
  if (token) {
    document.location = `./trainingPlan?token=${token}`;
  } else {
    document.location = "./login";
  }
}

function resetUrl1() {
  const token = localStorage.getItem('token') || getTokenFromUrl();
  if (token) {
    document.location = `./trainMode?token=${token}`;
  } else {
    document.location = "./login";
  }
}

function resetUrl2() {
  const token = localStorage.getItem('token') || getTokenFromUrl();
  if (token) {
    document.location = `./profileMain?token=${token}`;
  } else {
    document.location = "./login";
  }
}
function resetUrl3() {
  const token = localStorage.getItem('token') || getTokenFromUrl();
  if (token) {
    document.location = `./register?token=${token}`;
  } else {
    document.location = "./login";
  }
}
function getTokenFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
}













document.addEventListener('DOMContentLoaded', function() {
  
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);


  const weightButtons = document.querySelectorAll('.weight-btn, .nav-item');
  weightButtons.forEach(button => {
    button.addEventListener('touchstart', function() {
      this.style.transform = 'scale(0.95)';
    }, { passive: true });
    
    button.addEventListener('touchend', function() {
      this.style.transform = '';
    }, { passive: true });
  });
});