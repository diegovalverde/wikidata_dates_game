var correctCards = 0;
var deck = [];
const API_URL = `https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&query=`;
const numberOfCards = 8;
$( init );
//
// window.onload = function() {
//   console.log("???");
//
// }

function init() {
  queryWikiData();
  console.log("xxx???");


  // Hide the success message
  $('#successMessage').hide();
  $('#successMessage').css( {
    left: '0px',
    top: '0px',
    width: 0,
    height: 0
  } );

  // Reset the game
  correctCards = 0;
  $('#cardPile').html( '' );
  $('#cardSlots').html( '' );

  // Create the pile of shuffled cards
  var numbers = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
  numbers.sort( function() { return Math.random() - .5 } );
  //
  // for ( var i=0; i<10; i++ ) {
  //   $('<div>' + '<img src=' +
  //   deck[i] +
  //   'width="128" height="128"/>' + '</div>')
  //     .data( 'number', numbers[i] )
  // .attr( 'id', 'card'+numbers[i] ).appendTo( '#cardPile' ).draggable( {
  //     containment: '#content',
  //     stack: '#cardPile div',
  //     cursor: 'move',
  //     revert: true
  //   } );
  // }

  // Create the card slots
  var words = [ 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten' ];
  for ( var i=1; i<=numberOfCards; i++ ) {
    $('<div>' + words[i-1] + '</div>').data( 'number', i ).appendTo( '#cardSlots' ).droppable( {
      accept: '#cardPile div',
      hoverClass: 'hovered',
      drop: handleCardDrop
    } );
  }

}

function handleCardDrop(event, ui) {

  //Grab the slot number and card number
  var slotNumber = $(this).data('number');
  var cardNumber = ui.draggable.data('number');

  //If the cards was dropped to the correct slot,
  //change the card colour, position it directly
  //on top of the slot and prevent it being dragged again
  if (slotNumber === cardNumber) {
    ui.draggable.addClass('correct');
    ui.draggable.draggable('disable');
    $(this).droppable('disable');
    ui.draggable.position({
      of: $(this), my: 'left top', at: 'left top'
    });
    //This prevents the card from being
    //pulled back to its initial position
    //once it has been dropped
    ui.draggable.draggable('option', 'revert', false);
    correctCards++; //increment keep track correct cards
  }

  //If all the cards have been placed correctly then
  //display a message and reset the cards for
  //another go
  if (correctCards === 10) {
    $('#successMessage').show();
    $('#successMessage').animate({
      left: '380px',
      top: '200px',
      width: '400px',
      height: '100px',
      opacity: 1
    });
  }



}

function resolveWikiMediaImgUri(mediaUri){
//https://en.wikipedia.org/w/api.php?action=query&titles=File:{}&prop=imageinfo&iiprop=url
  var imageName = mediaUri.split("FilePath/");

  var md5 = CryptoJS.MD5(imageName[1]).toString();
  // see https://stackoverflow.com/questions/34393884/how-to-get-image-url-property-from-wikidata-item-by-api
  var url = 'https://upload.wikimedia.org/wikipedia/commons/' +
      md5[0] + '/' +
      md5[0] + md5[1] + '/' + imageName[1];

  return url;
}

function resolveWikiMediaImgUri2(mediaUri)
{
  var imageName = mediaUri.split("FilePath/");
  var url = "https://en.wikipedia.org/w/api.php";

  var params = {
      action: "query",
      format: "json",
      prop: "imageinfo",
      iiprop: "url",
      titles: "File:" + imageName[1]
  };

  url = url + "?origin=*";
  Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});

  fetch(url)
      .then(function(response){return response.json();})
      .then(function(response) {
          var pages = response.query.pages;
          var imageUrl = pages[-1].imageinfo[0].url;
          console.log(imageUrl);
          //deck.push(pages[-1].imageinfo[0].url);

          $('<div>' +
            '<img src="' +
                  imageUrl +
                  '" width="128px" height="128px"/>' +
            '</div>')
            .data( 'number', 0 )
        .attr( 'id', 'card' + '0' ).appendTo( '#cardPile' ).draggable( {
            containment: '#content',
            stack: '#cardPile div',
            cursor: 'move',
            revert: true
          } );

      })
      .catch(function(error){console.log(error);});
}


function queryWikiData(){
  let query = `
SELECT ?item ?itemLabel ?pic ?date
WHERE
{
  ?item wdt:P31 wd:Q13418847.
  ?item wdt:P18 ?pic.
  ?item wdt:P585 ?date
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
} LIMIT 10
  `;

  runQuery(query, results =>
    {

      for (let result of results){
        resolveWikiMediaImgUri2(result.pic.value);
     }

    }

  );

}



//Credit: This function was taken from Blinry wonderful card generator game:
//https://cardgame.morr.cc/
function runQuery(query, callback) {

    window.fetch(API_URL+query).then(
        function (response) {
            if (response.status !== 200) {
                setStatus(`The query took too long or failed. This is probably a bug, let us know! (Status code: ${response.status})`);
                return;
            }
            response.json().then(function (data) {
                callback(data.results.bindings);
            });
        }
    ).catch(function (err) {
        setStatus('An error occurred while running the query: "'+err+'"');
    });
}
