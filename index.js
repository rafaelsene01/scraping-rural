import "dotenv/config";
import Car from "./car.js";

(async function () {
  const car = new Car();

  await car.login();
  Promise.all([
    await car.search("25570056300"),
    await car.search("12090509864"),
    await car.search("16069820100"),
    await car.search("40281306893"),
    await car.search("01566375967"),
    await car.search("40071103872"),
    await car.search("03038346500"),
    await car.search("30353680826"),
    await car.search("6362208854"),
  ]).then((list) => {
    console.log("25570056300 => ", list[0].length);
    console.log("12090509864 => ", list[1].length);
    console.log("16069820100 => ", list[2].length);
    console.log("40281306893 => ", list[3].length);
    console.log("01566375967 => ", list[4].length);
    console.log("40071103872 => ", list[5].length);
    console.log("03038346500 => ", list[6].length);
    console.log("30353680826 => ", list[7].length);
    console.log("6362208854 => ", list[8].length);
  });
})();
