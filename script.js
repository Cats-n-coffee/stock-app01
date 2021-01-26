const apiKey = 'W0UZ1STI8M3HO4U6';

const thirtyMinButton = document.getElementById('30min-button');
const dailyButton = document.getElementById('daily-button');
const weeklyButton = document.getElementById('weekly-button');
const monthlyButton = document.getElementById('monthly-button');
const inputSearch = document.getElementById('search-field');
const searchButton = document.getElementById('search-button');
const searchResults = document.getElementsByClassName('search-results')[0];
const previousSearch = document.getElementsByClassName('previous-search')[0];
const mainDiv = document.getElementsByClassName('main-div')[0];

searchButton.addEventListener('click', autoCompleteSearch)

function autoCompleteSearch() {
    if (searchResults.hasChildNodes()) {
        clearDisplay()
    }
    var userInput = inputSearch.value;
    console.log(userInput);
    fetch(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${userInput}&apikey=${apiKey}`)
    .then(response => response.json())
    .then(data => displaySearchResults(data))
    inputSearch.value = '';
}

function displaySearchResults(data) {
    if (searchResults.style.display === 'none') {
        searchResults.style.display = 'block';
    }
    var results = data.bestMatches;
    for (let i = 0; i < results.length; i++) {
        var result = results[i];
        var resultSymbol = result['1. symbol'];
        var resultName = result['2. name'];
        console.log(resultSymbol, resultName);

        // Creates a line for each result
        var resultLine = document.createElement('div');
        resultLine.classList.add('result-line');
        resultLine.addEventListener('click', selectResult)
        
        var symbolSpan = document.createElement('span');
        symbolSpan.classList.add('symbol-span');
        symbolSpan.innerText = resultSymbol;
        resultLine.appendChild(symbolSpan);
        
        var nameParagraph = document.createElement('p');
        nameParagraph.innerText = resultName;
        resultLine.appendChild(nameParagraph);

        searchResults.appendChild(resultLine)
    }
    
}

// Enables the ability to click a search result, stores it and searches the API for stock prices
function selectResult(e) {
    if (e.target.className === 'symbol-span'){
        var selectedSymbol = e.target.innerText;
        storeInLocalStorage(selectedSymbol);
        storeinLocalArray(selectedSymbol);
        getDataIntraday(selectedSymbol);
    }
    searchResults.style.display = 'none';
    previousSearch.style.display = 'block';
}

function storeInLocalStorage(selectedSymbol) {
    localStorage.setItem('Symbol', selectedSymbol)
}

function storeinLocalArray(selectedSymbol) {
    var symbolArray;
    if (localStorage.getItem('symbolArray') === null) {
        symbolArray = [];
    } else {
        symbolArray = JSON.parse(localStorage.getItem('symbolArray'));
    }

    symbolArray.push(selectedSymbol);
    localStorage.setItem('symbolArray', JSON.stringify(symbolArray));
}

function getDataIntraday(companySymbol) {
    fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${companySymbol}&interval=30min&apikey=${apiKey}`)
    .then(res => res.json())
    .then(data => {
        console.log(data);
        var allNumbers = data['Time Series (30min)'];
        var metaData = data['Meta Data']['2. Symbol'];
        getNumbers(allNumbers, metaData)})
}

// Prepares an array for to make the chart with the queried data
function getNumbers(data, metaData) {
    var allNumbers = data;
    var newArrayWithData = [];
    for (const interval in allNumbers) {
        var openPrice = allNumbers[interval]['1. open'];
        var closePrice = allNumbers[interval]['4. close'];
        var lowPrice = allNumbers[interval]['3. low'];
        var highPrice = allNumbers[interval]['2. high'];
        var intervalTime = interval.split(' ');
        if(intervalTime.length > 1){
            intervalTime = intervalTime.pop().toString();
            intervalTime = intervalTime.substring(0, intervalTime.length-3);
        } else {
            intervalTime = intervalTime.toString();
        }
        newArrayWithData.push([intervalTime, parseFloat(lowPrice), parseFloat(closePrice), parseFloat(openPrice), parseFloat(highPrice)])
    }
    console.log(newArrayWithData, metaData)
    drawChart(newArrayWithData, metaData)
}

google.charts.setOnLoadCallback(drawChart);

async function drawChart(newArrayWithData, metaData) {
    var data = await new google.visualization.DataTable();
        data.addColumn('string', 'times');
        data.addColumn('number', 'lowprice');
        data.addColumn('number', 'closeprice');
        data.addColumn('number', 'openprice');
        data.addColumn('number', 'highprice');
        
        for (let i = 0; i < newArrayWithData.length; i++){
            data.addRow(newArrayWithData[i]);
        }
  
      var options = {
        title:`${metaData} stock price`,
        width: 3000,
        height: 700,
        chartArea: { left: 100, width: "100%", height: "70%" },
        legend: 'none'
      };
  
      var chart = await new google.visualization.CandlestickChart(document.getElementById('chart-div'));
  
      chart.draw(data, options);
}

thirtyMinButton.addEventListener('click', thirtyMinFunction)

function thirtyMinFunction() {
    var companySymbol = localStorage.getItem('Symbol');
    getDataIntraday(companySymbol);
}

dailyButton.addEventListener('click', getDataDaily)

function getDataDaily() {
    var companySymbol = localStorage.getItem('Symbol');
    fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${companySymbol}&apikey=${apiKey}`)
    .then(response => response.json())
    .then(data => {
        var dailyNumbers = data['Time Series (Daily)'];
        var metaData = data['Meta Data']['2. Symbol'];
        console.log(dailyNumbers, metaData)
        getNumbers(dailyNumbers, metaData);
    })
}

weeklyButton.addEventListener('click', getDataWeekly);

function getDataWeekly() {
    var companySymbol = localStorage.getItem('Symbol');
    fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${companySymbol}&apikey=${apiKey}`)
    .then(response => response.json())
    .then(data => {
        var weeklyNumbers = data['Weekly Time Series'];
        var metaData = data['Meta Data']['2. Symbol'];
        console.log(weeklyNumbers, metaData)
        getNumbers(weeklyNumbers, metaData);
    })
}

monthlyButton.addEventListener('click', getDataMonthly);

function getDataMonthly() {
    var companySymbol = localStorage.getItem('Symbol');
    fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${companySymbol}&apikey=${apiKey}`)
    .then(response => response.json())
    .then(data => {
        var monthlyNumbers = data['Monthly Time Series'];
        var metaData = data['Meta Data']['2. Symbol'];
        console.log(monthlyNumbers, metaData)
        getNumbers(monthlyNumbers, metaData);
    })
}

previousSearch.addEventListener('click', showPreviousSearch)

// Retrieves previous searches from local storage and displays them
// Allows to click on an item to display its stock price on the chart
function showPreviousSearch() {
    var storedArray = JSON.parse(localStorage.getItem('symbolArray'));
    console.log(storedArray)
    var popupWrapper = document.createElement('div');
    popupWrapper.classList.add('popup-wrapper');
    popupWrapper.addEventListener('click', () => {
        popupWrapper.style.display = 'none';
    })
    var popup = document.createElement('div');
    popup.classList.add('popup');
    var popupTitle = document.createElement('h3');
    popupTitle.innerText = 'Your Previous Search';
    popup.appendChild(popupTitle);
    
    for (let i = 0; i < storedArray.length; i++) {
        var item = storedArray[i];
        var oneSymbol = document.createElement('span');
        oneSymbol.innerHTML = item;
        oneSymbol.addEventListener('click', (e) => {
            var selectedSearch = e.target.innerText;
            localStorage.setItem('Symbol', selectedSearch);
            getDataIntraday(selectedSearch);
            popupWrapper.style.display = 'none';
        })
        popup.appendChild(oneSymbol);
    }
    popupWrapper.appendChild(popup);
    mainDiv.appendChild(popupWrapper);
}


function clearDisplay() {
    while (searchResults.firstChild) {
        searchResults.removeChild(searchResults.firstChild)
    }
}