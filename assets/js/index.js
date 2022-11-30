let allData = [];
const criteria = {
  q: "",
};

let selectedCoins = [];

let latestSelectedCoin;

let chart;

let chartsData = {};

let chartsInterval;

$(function () {
  const ls = localStorage.getItem("selectedCoins");
  selectedCoins = ls ? JSON.parse(ls) : [];

  switchPage("coins");
});

function switchPage(wich) {
  switch (wich) {
    case "coins":
      // load coins
      clearInterval(chartsInterval);
      loadingPage();
      $.ajax({
        url: "coins.html",
        success: function (response) {
          $(".main-container").html(response);
          initCoins();
        },
      });
      break;
    case "reports":
      //load reports
      $.ajax({
        url: "reports.html",
        success: function (response) {
          $(".main-container").html(response);
          createCharts();
        },
      });

      break;
    case "about":
      // loud about
      clearInterval(chartsInterval);
      loadingPage();
      $.ajax({
        url: "about.html",
        success: function (response) {
          $(".main-container").html(response);
          loadingPage("done");
        },
      });

      break;
  }
}
function loadingPage(status) {
  status
    ? $(".screen").remove()
    : $("body").append(
        '<div class="screen"><div class="loading-screens"><img src="./assets/images/loading.gif" class="loadimg-screen" alt=""></div></div>'
      );
}

function initCoins() {
  const cache = getCache();
  const twoMinutes = 1000 * 60 * 2;
  if (
    (cache &&
      cache.timestamp &&
      cache.timestamp + twoMinutes < new Date().getTime()) ||
    !cache.timestamp
  ) {
    console.log("getting data from server");
    $.ajax({
      url: "https://api.coingecko.com/api/v3/coins",
      crossDomain: true,
      success: function (data) {
        allData = data;
        console.log("data", data);
        renderCripto();
        bindEvenets();
        loadingPage("done");
        setCache({ timestamp: +new Date(), data });
      },
      error: function (error) {
        alert(error.responseText);
      },
    });
  } else {
    console.log("getting data from cache");
    allData = cache.data;
    renderCripto();
    bindEvenets();
    loadingPage("done");
  }
}

function getDataByCriteria() {
  if (!criteria.q) return allData;
  return allData.filter((data) => {
    return data.symbol.toLowerCase().includes(criteria.q.toLowerCase());
  });
  return data.symbol.toLowerCase().includes(criteria.q.toLowerCase());
}

function renderCripto() {
  const data = getDataByCriteria();
  // Create Cards
  let strHTML = "";
  for (let i = 0; i < data.length; i++) {
    let checked = "";
    if (selectedCoins.indexOf(data[i].symbol) !== -1) {
      checked = "checked";
    }
    strHTML += `<div class="card col-12 col-md-6 col-lg-4 text-center" style="width: 18rem;">
            <div class="card-body">
            <label class="switch">
            <input type="checkbox" ${checked} onclick="toggleCoin(this,'${data[i].symbol}')">
            <span class="slider round"></span>
            </label>
            <h5 class="card-title">${data[i].name}</h5>
            <hr>
            <p class="card-text">${data[i].symbol}</p>
            <button class="btn btn-success" data-toggle="collapse" data-target="#collapseExample${i}">More Info</button>
                <div class="collapse" id="collapseExample${i}">
                <div class="card card-body images">
                <img src="${allData[i].image.large}" alt="coinImg">
                ${data[i].market_data.current_price.eur}€<br>
                ${data[i].market_data.current_price.usd}$<br>
                ${data[i].market_data.current_price.ils}₪<br>
                </div>
                </div>
            </div>
            </div>`;
  }
  $(".coins").html(strHTML);
  // End .....
}

function toggleCoin(el, symbol) {
  if (el.checked === true && selectedCoins.length === 5) {
    el.checked = false;
    latestSelectedCoin = symbol;
    let strHTML = "";
    for (let i = 0; i < selectedCoins.length; i++) {
      const currCoinSymbol = selectedCoins[i];
      const currCoin = allData.find((coin) => coin.symbol === currCoinSymbol);
      strHTML += `<div class="card col-12 col-md-6 col-lg-4 text-center" style="width: 18rem;">
                        <div class="card-body">
                            <label class="switch">
                            <input type="checkbox" checked onclick="toggleCoin(this,'${currCoin.symbol}'); renderCripto()">
                            <span class="slider round"></span>
                            </label>
                            <h5 class="card-title">${currCoin.name}</h5>
                            <hr>
                            <p class="card-text">${currCoin.symbol}</p>
                        </div>
                    </div>`;
    }
    $(".modal-body").html(strHTML);
    let titleString = `<h5 class ="title-String">You can pick up to five coins. To add another coin Please pick a coin to remove.`;
    $(".modal-title").html(titleString);

    $("#myModal").modal("show");
    return;
  }

  if (selectedCoins.includes(symbol)) {
    const index = selectedCoins.indexOf(symbol);
    selectedCoins.splice(index, 1);
  } else {
    selectedCoins.push(symbol);
  }
  console.log("selectedCoins", selectedCoins);
  localStorage.setItem("selectedCoins", JSON.stringify(selectedCoins));
}

function bindEvenets() {
  $("#searchInfo").click(onSearch);
}

function onSearch(e) {
  e.preventDefault();
  criteria.q = $("#searchData").val();
  renderCripto();
}

function getCache() {
  const cache = localStorage.getItem("cache");
  return cache ? JSON.parse(cache) : {};
}

function setCache(data) {
  localStorage.setItem("cache", JSON.stringify(data));
}

function onSaveModal() {
  if (latestSelectedCoin && selectedCoins.length < 5) {
    selectedCoins.push(latestSelectedCoin);
    localStorage.setItem("selectedCoins", JSON.stringify(selectedCoins));
    latestSelectedCoin = "";
    renderCripto();
  }
}
function createCharts() {
  $.ajax({
    url: `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${selectedCoins.join(
      ","
    )}&tsyms=USD,EUR$api_key=37cd1eaf8eb8c84b023c4e29f70d11704e627bb2f2eda2784eeabeba82fd50e5`,
    success: function (response) {
      let chartData = [];
      for (let key in response) {
        chartsData[key] = {
          type: "line",
          showInLegend: true,
          name: key,
          markerType: "square",
          xValueFormatString: "hh:MM:ss",
          yValueFormatString: "#,##0K",
          dataPoints: [{ x: new Date(), y: response[key].USD }],
        };

        chartData.push(chartsData[key]);
      }

      const options = {
        animationEnabled: true,
        theme: "light2",
        title: {
          text: `Price over time`,
        },
        axisX: {
          title:
            "date" + new Intl.DateTimeFormat(["ban", "id"]).format(new Date()),
          valueFormatString: "hh:MM:ss",
        },
        axisY: {
          title: "price",
          suffix: "K",
          minimum: 0,
        },
        toolTip: {
          shared: true,
        },
        legend: {
          cursor: "pointer",
          verticalAlign: "bottom",
          horizontalAlign: "left",
          dockInsidePlotArea: true,
        },
        data: chartData,
      };

      chart = new CanvasJS.Chart("chartContainer", options);
      chart.render();

      chartsInterval = setInterval(() => {
        updateChart();
      }, 2000);

      console.log("response", response);
    },
  });
}

function updateChart() {
  $.ajax({
    url: `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${selectedCoins.join(
      ","
    )}&tsyms=USD,EUR$api_key=37cd1eaf8eb8c84b023c4e29f70d11704e627bb2f2eda2784eeabeba82fd50e5`,
    success: function (response) {
      let i = 0;
      for (let key in response) {
        const currCoin = response[key];
        chart.options.data[i].dataPoints.push({
          x: new Date(),
          y: response[key].USD,
        });
        i++;
      }
      chart.render();
    },
  });
}
