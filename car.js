import { load } from "cheerio";
import * as fastq from "fastq";
import { headers, cloudGet, cloudPost } from "./request.js";
import { getCarPage } from "./queue.js";

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

  async search(taxId) {
    const cars = [];

    const q = fastq.promise(getCarPage, 100);

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

    q.push({ body }).then((result) => result.forEach((car) => cars.push(car)));

    const lastIndex = $(`a.page-link[href*="/search?"]`).last();
    if (!!lastIndex.length) {
      const href = lastIndex[0].attribs["href"];
      const lasPage = /page=/.test(href) ? href.split("page=")[1] : 1;

      for (let i = 2; i <= lasPage; i++) {
        q.push({ page: i, taxId }).then((result) =>
          result.forEach((car) => cars.push(car))
        );
      }
    }

    await q.drained();

    return cars;
  }
}

export default Car;
