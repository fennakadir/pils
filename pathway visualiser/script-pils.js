// QUERIES wikidata for all diseases and creates SELECTION element in HTML
{
  query_disease = `SELECT DISTINCT ?disease ?diseaseLabel
                  WHERE {
                  ?disease wdt:P31 wd:Q12136 .
                  ?disease	wdt:P2293 ?gene .
                  ?pathway wdt:P31 wd:Q4915012 ;
                            wdt:P527 ?gene .
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
                } ORDER BY ?diseaseLabel`;
  fetch(
  wdk.sparqlQuery(query_disease)
  ).then( response => response.json()
  ).then( wdk.simplify.sparqlResults
  ).then(
  function (response) {
    for (var i = 0; i < response.length; i++) {
      var option = document.createElement("option");
      option.text = response[i].disease.label;
      option.value = `wd:`+response[i].disease.value;
      var select = document.getElementById("disease_selection");
      select.appendChild(option);
    }
  }
  )
}

// Make the SELECTION element DRAGGABLE
// Code adapted from https://www.w3schools.com/howto/howto_js_draggable.asp
{
  dragElement(document.getElementById("drag"));

  function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
      // if present, the header is where you move the DIV from:
      document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
      // otherwise, move the DIV from anywhere inside the DIV:
      elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
}


// Queries WIKIDATA for all the GENES associated with the selected disease
// and all the PATHWAYS associated with those genes
function wikidataQuery(){

    var wdID = document.getElementById("disease_selection").value;
    // WIKIDATA QUERY
    query_wikidata = `SELECT DISTINCT ?geneLabel ?pathwayLabel ?pathwayID
                      WHERE { ?disease	wdt:P2293 ?gene .
                        ?disease wdt:P279*  `+ wdID +`.
                        ?pathway wdt:P31 wd:Q4915012 ;
                                 wdt:P527 ?gene .
                        ?pathway wdt:P2410 ?pathwayID .
                        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }}
                        ORDER BY ?pathwayID`;
    fetch(
      wdk.sparqlQuery(query_wikidata)
    ).then( response => response.json()
    ).then( wdk.simplify.sparqlResults
    ).then(
    function (response) {


// -------------------- Create TABLE with Pathways -----------------------------
      var tab = document.getElementById("pathTable");

      // Disease name
      document.getElementById('selecteddisease').innerHTML =
      document.getElementById('disease_selection').options[document.getElementById('disease_selection').selectedIndex].text;

      // If new disease is selected, remove pathways from previous query
      if (document.getElementsByClassName("newrow").length > 0){
        d3.selectAll(".newrow").remove();
      }

      // Add each pathway to the table
      for (var i = 0; i < response.length; i++) {
        if (i == 0 || response[i].pathwayID != response[i-1].pathwayID ){
          var row = tab.insertRow(i);
          row.className = "newrow";

          var cell1 = row.insertCell(0);
          var cell2 = row.insertCell(1);
          var cell3 = row.insertCell(2);
          cell1.className = "newcell1";
          cell2.className = "newcell2";
          cell3.className = "newcell3";

          var p = document.createElement("a");
          p.id = response[i].pathwayID;
          p.className = "pathselect";
          p.href = "http://identifiers.org/wikipathways/" + response[i].pathwayID;
          p.target = "_blank"
          p.innerHTML = response[i].pathwayID;

          cell1.appendChild(p);
          cell2.innerHTML = response[i].pathwayLabel;
          cell3.innerHTML = '<button type="button" onClick="wikipathwaysQuery('+response[i].pathwayID+');">Visualize</button> ';

          if ((document.getElementsByClassName("newrow").length) % 2 == 0){
            row.style.backgroundColor = "rgb(255,255,255,0.5)";
          }

        } else {
          var row = tab.insertRow(i);
        }
      }
// ----------------- END OF CREATE TABLE ---------------------------------------
    }
  )
}

// Queries WIKIPATHWAYS for all the interactions in the selected pathway
// and VISUALIZES them (d3.js)
function wikipathwaysQuery(pwID){

  x = document.getElementById('pathTable');

  try {
    for (var i = 0; i < x.tBodies[0].childElementCount; i++) {
      if (x.rows[i].cells[0].innerText == pwID.id && x.rows[i].cells.length != 0){
        document.getElementById('pathname').innerHTML = x.rows[i].cells[1].innerHTML;
        break;
      }
    }
  } catch (e) {
    console.log(e)
  }


  // WIKIPATHWAYS LINK for query
 var linkpwID = "<http://identifiers.org/wikipathways/" + pwID.id + ">";

 // Construct WP query
 query_wp =  `SELECT DISTINCT ?interaction ?source ?sourceLabel ?target ?targetLabel
              WHERE {
                ?pathway a wp:Pathway .
                ?pathway dc:identifier + ` + linkpwID + ` .
                ?interaction dcterms:isPartOf ?pathway .
                ?interaction a wp:Interaction .
                ?interaction wp:source ?source .
                ?interaction wp:target ?target .
                ?source rdfs:label ?sourceLabel .
                ?target rdfs:label ?targetLabel .
                }
                ORDER BY ?interaction`;

// construct WP URL
 wpURL =  "http://sparql.wikipathways.org/";
 var queryUrl = encodeURI( wpURL + "?query="+query_wp+"&format=json" );

 // Perform WP query
  $.ajax({
    dataType: "jsonp",
    url: queryUrl,
    success: function( _data ) {

      //simplify results
      var data = wdk.simplify.sparqlResults(_data)

      // Store pathway interactions with respective source + target
      var links = []
      for (var i = 0; i < data.length; i++){
        if (i == 0 || data[i].interaction != data[i-1].interaction){
            links.push({source: data[i].source.label,
                        sourceurl: data[i].source.value,
                        target: data[i].target.label,
                        targeturl: data[i].target.value,
                        type: "directed-interaction",
                        })
        }
      }

      // Compute the distinct nodes from the links.
      var nodes = [];
      var countnodes = 0;
      links.forEach(function(link) {
        link.source = nodes[link.source] || (nodes[link.source] = {name: link.source, url: link.sourceurl});
        link.target = nodes[link.target] || (nodes[link.target] = {name: link.target, url: link.sourceurl});
        countnodes++;

      });


// -------------- PATHWAY VISUALIZATION with d3.js library ---------------------
      {

        var width = 1000;
            height = 700;

        console.log(countnodes);
        if (countnodes > 60){
          height = 1600;
          width = 1600;
            }

      d3.selectAll("svg").remove()

      var svg = d3.select("#pathway").append("svg")
        .attr("width", width)
        .attr("height", height);


        // Per-type markers
        svg.append("defs").selectAll("marker")
            .data(["directed-interaction"])
          .enter().append("marker")
            .attr("id", function(d) { return d; })
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", -1.5)
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0,-5 L 10,0 L 0,5");

      // Apply force to the graph
      var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width, height])
        .linkDistance(100)
        .charge(-800)
        .on("tick", tick)
        .start();

      // Add links (interactions) as paths in the graph
      var path = svg.append("g").selectAll("path")
        .data(force.links())
        .enter().append("path")
        .attr("class", function(d) { return "link " + d.type; })
        .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

      // Add nodes (pathway elements) as circles in the graph
      var circle = svg.append("g").selectAll("circle")
        .data(force.nodes())
        .enter().append("circle")
        .attr("r", 15)
        .call(force.drag)
        .on('dblclick',function(d){
          window.open(d.url,'_blank');
          })
        .on('mouseover',function(d){
            d3.select(this).style("fill", "white");
            d3.select(this).style("cursor", "pointer");
          })
        .on("mouseout", function(d) {
          d3.select(this).style("fill", "#80bbc5");
          d3.select(this).style("cursor", "default");
        });

      // Add names to nodes
      var text = svg.append("g").selectAll("text")
        .data(force.nodes())
        .enter()
        .append("text")
        .attr("x", 8)
        .attr("y", ".31em")
        .text(function(d) { return d.name; });


      // Use elliptical arc path segments to doubly-encode directionality.
      function tick() {
        path.attr("d", linkArc);
        circle.attr("transform", transform);
        text.attr("transform", transform);
      }

      function linkArc(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr +
                                " 0 0,1 " + d.target.x + "," + d.target.y;
      }

      function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
      }
      }
    }
// ------------------ END OF Pathway VISUALIZATION -----------------------------
  }); // End of AJAX query for WP query
}
// ----------------------- END OF wikipathwaysQuery() ------------------------


// MINIMIZE the pathway selection box
function minimize(){
  var x = document.getElementById("pathway_selection");
  var b = document.getElementById("minimize");
  if (x.style.display === "none") {
    x.style.display = "block";
    b.innerHTML = "Minimize";
  } else {
    x.style.display = "none";
    b.innerHTML = "Show";
  }
}

// Change name to Show/Hide Description element
function showhide(){
  x = document.getElementById('desctoggle').innerHTML;
  if (x[3] == '+') {
    document.getElementById('desctoggle').innerHTML = "<b>-</b> Hide Description";
  } else {
    document.getElementById('desctoggle').innerHTML = "<b>+</b> Show Description";
  }
}
