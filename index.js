import "dotenv/config";
import Car from "./car.js";

(async function () {
  const car = new Car();

  await car.login();
  Promise.all([await car.search("CPF")]).then((list) => {
    console.log("CPF => ", list[0].length);
  });
})();
