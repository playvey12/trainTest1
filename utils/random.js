function getRandomElementFromArray(array) {
  if (Array.isArray(array) && array.length > 0) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  } else {
    return null;
  }
}

function getRandomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function getRandomIntOrNull(min, max) {
  let number = min + Math.floor(Math.random() * (max - min + 1));
  if (number % 3 == 0) {
    number = null;
  }
  return number;
}
function generateRandomString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

function randFile(folderpath) {
  const files = fs.readdirSync(folderpath);
  const file = files[randInt(0, files.length)];
  const filePath = path.join(folderpath, file);
  return filePath;
}


module.exports = {
  getRandomElementFromArray,
  getRandomInt,
  generateRandomString,
  randFile,
  getRandomIntOrNull,
};
