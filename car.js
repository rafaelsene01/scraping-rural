import { load } from "cheerio";
import cloudScraper from "cloudscraper";
import * as fastq from "fastq";

const headers = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "max-age=0",
  "Content-Type": "application/x-www-form-urlencoded",
  Origin: `${process.env.BASE_URL}`,
  Referer: `${process.env.BASE_URL}/accounts/login/?next=/`,
  "Sec-Ch-Ua":
    '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": "Windows",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
};

const cloudGet = async (options) => {
  return new Promise((resolve) => {
    cloudScraper.get(options, (error, response, body) =>
      resolve({ error, headers: response.headers, body })
    );
  });
};

const cloudPost = async (options) => {
  return new Promise((resolve) => {
    cloudScraper.post(options, (error, response, body) =>
      resolve({ error, headers: response.headers, body })
    );
  });
};

async function asyncWorker(car) {
  const { body: b5 } = await cloudGet({
    uri: `${process.env.BASE_URL}/car/item/${car}/`,
  });

  const $ = load(b5);
  const json = $("#carData[value]").attr("value");

  return JSON.parse(json);
}

class Car {
  constructor() {}

  async login() {
    const { body } = await cloudGet({
      uri: `${process.env.BASE_URL}/accounts/login/?next=/`,
    });

    let $ = load(body);
    const csrfmiddlewaretoken = $("input[name='csrfmiddlewaretoken']").attr(
      "value"
    );

    const formData = {
      csrfmiddlewaretoken,
      login: process.env.LOGIN,
      password: process.env.PASSWORD,
      remember: "on",
      next: "/",
    };

    await cloudPost({
      uri: `${process.env.BASE_URL}/accounts/login/`,
      formData,
      headers,
    });
  }

  listCar(body) {
    const $ = load(body);
    const p = $("p.card-text");
    if (!p?.text()?.trim()?.length) return [];
    return p?.toArray()?.map((el) => {
      const [car] = /[\D]{2}-[\d-]+[\d\D]([^,]+),/.exec(
        $(el)?.text()?.replace("\n", "")?.replace(/\s+/g, " ").trim()
      );
      return car.replace(",", "");
    });
  }

  async search(taxId) {
    const cars = [];
    let stop = false;
    let page = 1;

    const q = fastq.promise(asyncWorker, 100);

    {
      let body;
      const res = await cloudGet({
        uri: `${process.env.BASE_URL}/search?q=${taxId}`,
      });
      body = res.body;

      let $ = load(body);
      const isloggedIn = $(`a[href="/logout"]`);

      if (!isloggedIn.length) {
        await this.login();
        const res2 = await cloudGet({
          uri: `${process.env.BASE_URL}/search?q=${taxId}`,
        });
        body = res2.body;
        $ = load(body);
      }

      const next = $(`a[href="/search?q=${taxId}&page=${page++}"]`);

      if (!next?.length) stop = true;
      const list = this.listCar(body);
      list.forEach((car) => q.push(car).then((result) => cars.push(result)));
    }

    while (!stop) {
      const { body } = await cloudGet({
        uri: `${process.env.BASE_URL}/search?q=${taxId}&page=${page}`,
        headers: {
          Referer: `${process.env.BASE_URL}/search?q=${taxId}&page=${page - 1}`,
        },
      });

      const list = this.listCar(body);
      list.forEach((car) => q.push(car).then((result) => cars.push(result)));

      const $ = load(body);
      const next = $(`a[href="/search?q=${taxId}&page=${page++ + 1}"]`);

      if (!next?.length) stop = true;
    }

    await q.drained();

    return cars;
  }
}

export default Car;
