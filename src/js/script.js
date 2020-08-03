


var correctCards = 0;
var attemptsLeft = 3;



const WIKIDATA_API_URL = `https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&query=`;
const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";
const numberOfCards = 8;
$( init );


function init() {
  queryWikiData();


  $('#successMessage').hide();
  $('#successMessage').css( {
    left: '0px',
    top: '0px',
    width: 0,
    height: 0
  } );

  correctCards = 0;
  $('#cardPile').html( '' );
  $('#cardSlots').html( '' );


}

//------------------------------------------------------------------------------
function generateCard(mediaUri, cardName, dateOfEvent, id)
{
  var imageName = mediaUri.split("FilePath/");

  var params = {
      action: "query",
      format: "json",
      prop: "imageinfo",
      iiprop: "url",
      titles: "File:" + imageName[1]
  };

  var url = WIKIPEDIA_API_URL + "?origin=*";
  Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});

  fetch(url)
      .then(function(response){return response.json();})
      .then(function(response) {
          var pages = response.query.pages;
          var imageUrl = pages[-1].imageinfo[0].url;

          console.log(imageUrl);

        $('<div class="card" >' +
          cardName +
            '</div>')
            .data( 'year_of_event', dateOfEvent )
            .data('card_id', id)
        .attr( 'id', 'card' + id.toString() ).appendTo( '#cardPile' ).draggable( {
            containment: '#content',
            stack: '#cardPile div',
            cursor: 'move',
            revert: true
          } )

          .css({
            'background-image': 'url('+imageUrl+')',
            'background-size': 'cover'
          });




      })
      .catch(function(error){console.log(error);});
}

//------------------------------------------------------------------------------
function queryWikiData(){
  //you can execute this query in: https://query.wikidata.org/
  let query = `
    SELECT ?item ?itemLabel ?pic ?date (MD5(CONCAT(str(?item),str(RAND()))) as ?random)
    WHERE
    {
      ?item wdt:P31 wd:Q13418847.
      ?item wdt:P18 ?pic.
      ?item wdt:P585 ?date
      SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
    } ORDER BY ?random
    LIMIT 100` ;



  runQuery(query, results =>{
    let dates = [];
    results.sort(function (a, b) { return 0.5 - Math.random() });
    results.splice(0, results.length - numberOfCards);
      let id = 0;
      for (let result of results){
        console.log(result.item.value);

        let date = result.date.value.split('-');
        let qid = result.item.value.split('entity/');
        dates.push([date[0], qid[1]]);
        generateCard(result.pic.value, result.itemLabel.value, date[0],id);
        id++;
     }

     //TODO: This sort is not working
     //dates.sort(function (a, b) { return 0.5 - Math.random() });

     for (let date of dates ){
       $('<div>' + date[0] + '</div>')
         .data( 'year_of_event', date[0] )
         .data('qid', date[1])
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

    window.fetch(WIKIDATA_API_URL+query).then(
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

function handleCardDrop(event, ui) {

  var slotNumber = $(this).data('year_of_event');
  var cardNumber = ui.draggable.data('year_of_event');
  var cardId = ui.draggable.data('card_id');

  if (slotNumber === cardNumber) {

    ui.draggable.draggable('disable');
    $(this).droppable('disable');
    ui.draggable.position({
      of: $(this), my: 'left top', at: 'left top'
    });
    ui.draggable.draggable('option', 'revert', false);
    correctCards++;

    //88888

    //https://www.wikidata.org/w/api.php?action=wbgetentities&format=xml&props=sitelinks&ids=Q19675
    var params = {
        action: "wbgetentities",
        format: "json",
        props: "sitelinks",
        ids: $(this).data('qid'),
        sitefilter: "enwiki"
    };

    var url = "https://www.wikidata.org/w/api.php"+ "?origin=*";
    Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});

    fetch(url)
        .then(function(response){return response.json();})
        .then(function(response) {
            let wikipediaTile = Object.values(response['entities'])[0]['sitelinks']['enwiki']['title'];
            let wikipediaUrl =  'https://en.m.wikipedia.org/wiki/' + wikipediaTile.split(' ').join('_');
            console.log(wikipediaUrl);
            tippy('#card' + cardId.toString(), {
                  // placement: 'top',
                   content: ' <div class="box"><iframe src="'+ wikipediaUrl + '" width = "600px" height = "300px"></iframe></div>  ',});
          });
    //88888




  } else {
    console.log('Nop');
  }


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
