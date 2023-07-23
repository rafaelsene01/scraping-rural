import cloudScraper from "cloudscraper";

export const headers = {
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

export const cloudGet = async (options) => {
  return new Promise((resolve) => {
    cloudScraper.get(options, (error, response, body) =>
      resolve({ error, headers: response.headers, body })
    );
  });
};

export const cloudPost = async (options) => {
  return new Promise((resolve) => {
    cloudScraper.post(options, (error, response, body) =>
      resolve({ error, headers: response.headers, body })
    );
  });
};
