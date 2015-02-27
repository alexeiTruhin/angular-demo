var express = require("express");
var app = express();

var fs = require("fs");
var jsonFile = fs.readFileSync('data/example.json', 'utf8');
var oData = JSON.parse(fs.readFileSync('data/example.json', 'utf8')); // original data
var fData; // filtered data

/* serves main page */
app.get("/", function(req, res) {
  res.sendFile(__dirname + '/public/index.html')
});

/* serves data */
app.get("/data/", function(req, res) {
  console.log('data request!');
  console.log(req.query);
  fData = filterData(JSON.parse(jsonFile), req.query);
  res.send(fData);
/*  setTimeout(function() {
  }, 1000);*/
});

/* serves all the static files */
app.get(/^(.+)$/, function(req, res){
  console.log('static file request : ' + '/public' + req.params[0]);
  res.sendFile( __dirname + '/public/' + req.params[0]);
});


/* start server */
var port = process.env.PORT || 8000;
app.listen(port, function() {
  console.log("Listening on " + port);
});



// creating filtered data
function filterData(data, params) {
  for (p in params) {
    if (params[p] === '') {
      delete params[p];
    } else {
      params[p] = decodeURIComponent(params[p]);
      params[p] = params[p].split(','); // transform string into array
    }
  }

  // Selected products
  var newProducts = []
  if (typeof params['_selected'] !== 'undefined') {
    if (params['_selected'].length > 1) {
      data.products.forEach(function(prod) {
        var index = params['_selected'].indexOf(prod['id']);
        if (index > -1) {
          newProducts.push(prod);
        }
      });

      data.products = newProducts;
    }
  }

  // ------


  var item;
  var prop;
  var index;
  var del = []; // delete
  var min, max, state; // min max of rangeSlider
  for (item in data.products) {
    for (prop in data.products[item]) {
      if (typeof params[prop] !== 'undefined' && del.indexOf(item) < 0) {
        if (data.facets[prop].filterView === 'rangeSlider') {
          // rangeSlider
          min = parseFloat(params[prop][0]);
          max = parseFloat(params[prop][1]);
          state = parseFloat(data.products[item][prop]);
          if (state < min || state > max)
            del.push(item);
        } else {
          // checkbox or others
          index = params[prop].indexOf('' + data.products[item][prop]);
          if (index  < 0) {
            del.push(item);
            continue;
          }
        }
      }
    }
  }

  for (d in del) {
    data.products.splice(del[d] - d, 1);
  }

  // Order
  if (typeof params['_order'] !== 'undefined') {
    var facet = params['_order'][0];
    var order = params['_order'][1];
    if (typeof data.facets[facet] !== 'undefined') {
        data.products.sort(function(a, b) {
          return a[facet] > b[facet];
        });
      if (order == 'desc') {
        data.products.reverse();
      }
    }
  }

  return data;
}