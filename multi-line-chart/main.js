(function() {
  2019-05-01

  const today = new Date();
  const todayFormatted = 
      `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, 0)}-01`;
  
  const fetchPrices = (currencyCode) => {
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${currencyCode}?from=${todayFormatted}&apikey=6243fac87451ba24ec45a5f37563d6f0`;

    return fetch(url).then(res => res.json());
  };

  Promise.all([fetchPrices('AAPL'), fetchPrices('FB')]) // , fetchPrices('MSFT')
      .then(([apple, google, microsoft]) => {
        const data = [];
        apple['historical'].forEach((a, i) => {
            data.push([
              {date: new Date(a['date']), apple: a['close']},
              {date: new Date(a['date']), fb: google['historical'][i]['close']},
              // {date: new Date(a['date']), microsoft: microsoft['historical'][i]['close']},
            ]);
        });
console.log(data);
        const element = document.querySelector('#multiLineChart');
        const config = {
          data,
          element,
          xProp: 'date',
          yProps: ['apple', 'fb'], // 'microsoft'],
          xScale: 'scaleTime',
          yScale: 'scaleLinear',
          xLabel: 'Price',
          margin: {left: 50, top: 30, right: 20, bottom: 50},
        };

        // Invoke multi line chart class to draw.
        new MultiLineChart(config);
      });
})();
