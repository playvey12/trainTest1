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