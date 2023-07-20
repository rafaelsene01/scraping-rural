import "dotenv/config";
import { load } from "cheerio";
import cloudScraper from "cloudscraper";
import * as fastq from "fastq";
// import tough from "tough-cookie";

// const cookieJar = new tough.CookieJar();

const headers = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "max-age=0",
  // "Content-Length": "166",
  "Content-Type": "application/x-www-form-urlencoded",
  Origin: `${process.env.BASE_URL}`,
  Referer: `{process.env.BASE_URL}/accounts/login/?next=/`,
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

const Cars = [];
async function asyncWorker(car) {
  const { body: b5 } = await cloudGet({
    uri: `${process.env.BASE_URL}/car/item/${car}/`,
  });

  // const registro_car = getText("Registro no CAR", b5);
  // const cadastrante = getText("Cadastrante", b5);
  // const area = getText("Área", b5);
  // const monicipio = getText("Muncípio", b5);
  // const uf = getText("UF", b5);
  // const modulo_fiscal = getText("Módulo Fiscal", b5);
  // const tipo = getText("Tipo Imóvel", b5);
  // const situacao = getText("Situação", b5);
  // const condicao = getText("Condição", b5);

  const $ = load(b5);
  const json = $("#carData[value]").attr("value");

  Cars.push(JSON.parse(json));
}

export const getText = (text, html) => {
  const $ = load(html);
  const element = $("*")
    .toArray()
    .find((el) => $(el).text().trim() === text);
  return $(element).next().text().replace("\n", "").replace(/\s+/g, " ").trim();
};

const api = async () => {
  await cloudGet({
    uri: `${process.env.BASE_URL}`,
  });

  const { body: b2 } = await cloudGet({
    uri: `${process.env.BASE_URL}/accounts/login/?next=/`,
  });

  {
    let $ = load(b2);
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

  const taxId = "25570056300";
  const items = [];
  let stop = false;
  let page = 1;
  while (!stop) {
    const uri =
      page > 1
        ? `${process.env.BASE_URL}/search?q=${taxId}&page=${page}`
        : `${process.env.BASE_URL}/search?q=${taxId}`;
    const { body: b4 } =
      page > 1
        ? await cloudGet({
            uri,
            headers: {
              Referer: `${process.env.BASE_URL}/search?q=${taxId}&page=${
                page - 1
              }`,
            },
          })
        : await cloudGet({
            uri,
          });

    let $ = load(b4);
    const next = $(`a[href="/search?q=${taxId}&page=${page++}"]`);

    if (next?.length === 0) stop = true;
    else {
      const p = $("p.card-text");
      p.toArray().map((el) => {
        const [car] = /[\D]{2}-[\d-]+[\d\D]([^,]+),/.exec(
          $(el).text().replace("\n", "").replace(/\s+/g, " ").trim()
        );
        items.push(car.replace(",", ""));
      });
    }
  }

  console.log(items);

  const q = fastq.promise(asyncWorker, 40);

  items.forEach((car) => q.push(car));
  await q.drained();

  console.log(Cars);
};

api();
