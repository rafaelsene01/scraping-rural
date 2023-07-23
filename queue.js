import { load } from "cheerio";
import * as fastq from "fastq";
import { cloudGet } from "./request.js";

const getCarList = (body) => {
  const $ = load(body);
  const p = $("p.card-text");
  if (!p?.text()?.trim()?.length) return [];
  return p?.toArray()?.map((el) => {
    const [car] = /[\D]{2}-[\d-]+[\d\D]([^,]+),/.exec(
      $(el)?.text()?.replace("\n", "")?.replace(/\s+/g, " ").trim()
    );
    return car.replace(",", "");
  });
};

export const getCardData = async (car) => {
  const { body } = await cloudGet({
    uri: `${process.env.BASE_URL}/car/item/${car}/`,
  });

  const $ = load(body);
  const json = $("#carData[value]").attr("value");

  if (json) return JSON.parse(json);
  throw new Error(car);
};

export const getCarPage = async ({ page, taxId, body }) => {
  let cars = [];

  if (body) {
    cars = getCarList(body);
  } else {
    const { body: newBody } = await cloudGet({
      uri: `${process.env.BASE_URL}/search?q=${taxId}&page=${page}`,
      headers: {
        Referer: `${process.env.BASE_URL}/search?q=${taxId}&page=${page - 1}`,
      },
    });
    cars = getCarList(newBody);
  }

  const carsData = [];

  const qData = fastq.promise(getCardData, 10);

  // Coloquei o catch pois se o cliente tiver muito cars, pode ser que ele é deslogado
  // assim começando a falhar a busca
  cars?.forEach((car) =>
    qData
      .push(car)
      .then((result) => carsData.push(result))
      .catch((error) => console.log(error))
  );

  await qData.drained();

  return carsData;
};
