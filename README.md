# signifier

Node.js tool for calculating significance, creates error bar charts in terminals

Use as a CLI tool with a CSV:

`npm i -g @porch/sampler`

`sampler --fileName="test.csv" --a="column_name_a" --b="column_name_b" --i=1000`

Will save a screenshot with error bar chart after running analysis. For newer terminals sampler will output results in the terminal:

![](termimg.png)

#### Inspiration

- Plotly
- Victory cli
- repng
