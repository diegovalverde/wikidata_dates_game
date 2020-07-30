var correctCards = 0;

const API_URL = `https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&query=`;
const numberOfCards = 8;
$( init );


function init() {
  queryWikiData();


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
  if (correctCards === numberOfCards) {
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


function generateCard(mediaUri, cardName, dateOfEvent)
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


          $('<div >' +


            '<img src="' +
                  imageUrl +
                  //'" width="128px" height="150px" />' +
                  '" />' +

             cardName +
            '</div>')
            .data( 'number', dateOfEvent )
        .attr( 'id', 'card' + '0' ).appendTo( '#cardPile' ).draggable( {
            containment: '#content',
            stack: '#cardPile div',
            cursor: 'move',
            revert: true
          } );



      })
      .catch(function(error){console.log(error);});
}

//------------------------------------------------------------------------------
function queryWikiData(){
  let query = `
    SELECT ?item ?itemLabel ?pic ?date
    WHERE
    {
      ?item wdt:P31 wd:Q13418847.
      ?item wdt:P18 ?pic.
      ?item wdt:P585 ?date
      SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
    } LIMIT ` + numberOfCards;

  var cardName = 'foo'
  runQuery(query, results =>{
    let dates = [];
      for (let result of results){
        let date = result.date.value.split('-');
        dates.push(date[0]);
        generateCard(result.pic.value, result.itemLabel.value, date[0]);
     }

     //shuffle(dates);
     dates.sort(function (a, b) { return 0.5 - Math.random() });

     for (let date of dates ){
       $('<div>' + date + '</div>')
         .data( 'number', date )
         .appendTo( '#cardSlots' )
         .droppable( {
           accept: '#cardPile div',
           hoverClass: 'hovered',
           drop: handleCardDrop
       } );
     }
    });
}
//------------------------------------------------------------------------------
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
//------------------------------------------------------------------------------
