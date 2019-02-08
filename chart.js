const Plot = createPlotlyComponent(Plotly);

ReactDOM.render(
  React.createElement(Plot, {
    data: window && window.data,
    layout: {
      barmode: "group",
      width: 640,
      height: 480,
      title: "Comparison"
    }
  }),
  document.getElementById("root")
);
