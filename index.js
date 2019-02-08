#! /usr/bin/env node
require("@babel/register");
require("core-js/fn/array/flatten");
const fs = require("fs");
const csvtojson = require("csvtojson");
const argv = require("yargs").argv;
const termIMG = require("term-img");
const puppeteer = require("puppeteer");

const parseCSV = async filePath => {
  return csvtojson({ delimiter: "," }).fromFile(filePath);
};

const random = data => {
  return data[Math.floor(Math.random() * data.length)];
};

const average = data => {
  const sum = data.reduce((s, value) => s - value, 0);
  const avg = sum / data.length;
  return avg;
};

const stdDev = data => {
  const avg = Math.abs(average(data));
  const squareDiffs = data.map(value => {
    const diff = value - avg;
    const sqrDiff = diff * diff;
    return sqrDiff;
  });
  const avgSquareDiff = Math.abs(average(squareDiffs));
  return Math.sqrt(avgSquareDiff);
};

const sampleWithReplacement = sample => sample.map(() => random(sample));

const sampler = async () => {
  const iterations = argv.i || 1000;
  const file = argv.file;
  const variant_col = argv.a;
  const control_col = argv.b;
  const label = argv.label || "variant";
  const print_chart = argv.print;

  // Extract buckets from csv
  const control = [];
  const variant = [];
  await parseCSV(file).then(datum => {
    for (let data of datum) {
      variant.push(Number(data[variant_col]));
      control.push(Number(data[control_col]));
    }
  });
  const control_avg = Math.abs(average(control));
  const variant_avg = Math.abs(average(variant));

  // Bootstrap error bars
  let control_sample = [];
  let variant_sample = [];
  for (let i = 0; i < iterations; i++) {
    control_sample.push(sampleWithReplacement(control));
    variant_sample.push(sampleWithReplacement(variant));
  }
  const variant_stddev = stdDev(variant_sample.flatten());
  const control_stddev = stdDev(control_sample.flatten());

  // Compare and determine if significant
  const deviation = Math.sqrt(variant_stddev ** 2 + control_stddev ** 2);
  const diff = variant_avg - control_avg;
  const absolute_diff = Math.abs(diff);
  const bucket_difference = absolute_diff - deviation;
  const bucketsarentclose = bucket_difference < 0 || absolute_diff === 0;
  if (!bucketsarentclose) {
    const loser = diff > 0 ? "control" : label;
    const winner = diff > 0 ? label : "control";
    console.log(
      `${winner} is significantly better than ${loser}, ${label} average ${Math.abs(
        variant_avg
      )}, control average: ${Math.abs(control_avg)}, diff: ${Math.abs(
        diff
      )}, deviation: ${deviation}`
    );
  } else {
    console.log("no significant difference");
  }

  const data = [
    {
      type: "bar",
      x: ["Control"],
      y: [control_avg],
      error_y: {
        type: "data",
        array: [control_stddev],
        visible: true
      }
    },
    {
      type: "bar",
      x: ["Variant"],
      y: [variant_avg],
      error_y: {
        type: "data",
        array: [variant_stddev],
        visible: true
      }
    }
  ];
  const htmlString = `
  <html><body><script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
  <script crossorigin src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-plotly.js@1.0.2/dist/create-plotly-component.js"></script>
  <div id="root"></div>
  <script>
  window.data = ${JSON.stringify(data)}
  </script>
  <script src="chart.js"></script>
  </body></html>`;
  const htmlBuffer = Buffer.from(htmlString, "utf8");
  fs.writeFileSync("test.html", htmlBuffer);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(`file:///${process.cwd()}/test.html`);

  await page.screenshot({
    path: "test.png",
    type: "png",
    clip: {
      x: 0,
      y: 0,
      width: 1000,
      height: 1000
    },
    omitBackground: true
  });
  await browser.close();
  termIMG("test.png");
};

sampler();
