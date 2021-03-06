'use strict';

let terms;
let categories;
let series;

const highChartConverter = (function ( $ ) {

  return  {

    convertCategories: function () {
      // initialize  xaxis categories (months)
      const months = [];
      $.map(data, function ( datapoint, i ) {
        months.push(datapoint["month"]);
      });

      return months;
    },

    convertSeries: function () {
      // initialize series data
      const series = [];
      $.map(terms, function ( term, i ) {
        const term_data = { "name": term, "data": [], "total_mentions": 0 }
        // build data
        $.map(data, function ( datapoint, i ) {
          term_data["data"].push( datapoint["terms"][term]["percentage"] );
          term_data["total_mentions"] += datapoint["terms"][term]["count"];
        });

        // calculate YOY change
        let first = term_data["data"][term_data["data"].length-13];
        let last = term_data["data"][term_data["data"].length-1]

        // assign a floor to have more meaningful change calculation
        if (first == 0) {
          first = 1;
        }
        if (last == 0) {
          last = 1;
        }

        term_data["change"] = (last - first) / first;
        term_data["latest_mentions"] = last;
        series.push(term_data);
      });

      return series;
    },

    convertCountYoySeries: function () {
      const countSeries = [];
      const months = {'Jan':0,'Feb':1,'Mar':2,'Apr':3,'May':4,'Jun':5,'Jul':6,'Aug':7,'Sep':8,'Oct':9,'Nov':10,'Dec':11};
      const years = {'13':0, '14':1, '15':2, '16':3, '17':4, '18':5};
      $.each(years, function(key, value) {
        countSeries.push({ name: "'" + key, data: [0,0,0,0,0,0,0,0,0,0,0,0]});
      });
      $.map(data, function(value, index) {
        const month = value.month.substr(0, 3);
        const year = value.month.substr(3, 2);
        if (typeof countSeries[years[year]] !== 'undefined') {
          countSeries[years[year]].data[months[month]] = parseInt(value.num_comments);
        }
      });

      return countSeries;
    }

  }

}) ( jQuery );

const chartBuilder = (function ( $ ) {

  function render( seriesData ) {
    $('#chart').highcharts({
      chart: {
        type: 'line'
      },
      title: {
        text: ''
      },
      xAxis: {
        categories: categories,
        labels: {
          step: 3,
          staggerLines: 1
        }
      },
      yAxis: {
        title: {
          text: 'Percentage of posts'
        },
        min: 0
      },
      tooltip: {
      },
      series: seriesData
    });
  }

  return {

    renderTopTerms: function( numTerms ) {
      render( series.slice( 0, numTerms ) );
    },

    renderComparison: function() {
      const compareTerms = [];
      const compareSeries = [];
      $(".term-compare").each ( function ( i, val ) {
        compareTerms.push( val.value.toLowerCase() );
      });
      $.each(series, function ( i, val) {
        if ( $.inArray(val.name.toLowerCase(), compareTerms) > -1 ) {
          compareSeries.push( val );
        }
      });
      render( compareSeries );
    }
  }

}) ( jQuery );

$(function () {
  data.reverse();
  terms = Object.keys( data[0]["terms"] );

  // transform raw data in to format consumable by highcharts
  categories = highChartConverter.convertCategories();
  series = highChartConverter.convertSeries();

  // sort by cumulative popularity
  series.sort(function(a,b){ return b.latest_mentions - a.latest_mentions });

  // wire up top terms filter
  $( "#topfilter" ).on( "change", function ( e ) {
    chartBuilder.renderTopTerms( parseInt($(this).val()) );
  });

  // process url parameters if present
  const url = new URL(window.location);
  const comparisons = url.searchParams.getAll("compare");
  if (comparisons.length > 0) {
    $("div#term_comparisons").empty();
    comparisons.forEach(function(queryTerm) {
      $("div#term_comparisons").append($("<input/>", {
        type: 'text',
        name: 'compare',
        value: queryTerm,
        class: "term-compare form-control form-control-sm"
      }));
    });
    chartBuilder.renderComparison();
  } else {
    chartBuilder.renderTopTerms(5);
  }

  $('#comments_chart').highcharts({
    chart: {
      type: 'column'
    },
    title: {
      text: ''
    },
    xAxis: {
      categories: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ],
    },
    yAxis: {
      min: 0,
      title: {
        enabled: false,
      },
      labels: {
      }
    },
    legend: {
      enabled: true
    },
    series: highChartConverter.convertCountYoySeries()
  });

  // wire up autocomplete
  $( ".term-compare" ).autocomplete({
    source: terms
  });

});
