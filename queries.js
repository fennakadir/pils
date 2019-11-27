function wikidataQuery(){
    // WIKIDATA QUERY
    query_wikidata = `SELECT ?geneLabel ?pathwayLabel ?pathwayID
                      WHERE { ?disease	wdt:P2293 ?gene .
                        ?disease wdt:P279*  wd:Q55950055.
                        ?pathway wdt:P31 wd:Q4915012 ;
                                 wdt:P527 ?gene .
                        ?pathway wdt:P2410 ?pathwayID .
                        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }}`;

    fetch(
      wdk.sparqlQuery(query_wikidata)
    ).then( response => response.json()
    ).then( wdk.simplify.sparqlResults
    ).then(
    function (response) {
      // CReate table with Pathway links
      var tab = document.getElementById("pathTable");
      for (var i = 0; i < response.length; i++) {
        var row = tab.insertRow(i);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var a = document.createElement("p");
        a.id = response[i].pathwayID;

        a.setAttribute('onclick',test())
        //a.onClick = "wikipathwaysQuery("+ response[i].pathwayID +")";
        a.appendChild(document.createTextNode(response[i].pathwayLabel));
        cell1.appendChild(a);
        cell2.innerHTML = response[i].pathwayID;
      }
    }
  )
}

function test(){
  console.log("abcdefg")
}

function wikipathwaysQuery(pwID){
  // WIKIPATHWAYS QUERY

  // Generate wikipathway url
  var wpURL = 'https://www.wikipathways.org/index.php/Pathway:';
  for (var i = 0; i < response.length; i++) {
    var id = response[i].pathwayID;
    fullURL = wpURL + id;
  }


 var pwID = "<http://identifiers.org/wikipathways/" + document.getElementById('id') + ">";

 // Construct WP query
 query_wp =  `SELECT DISTINCT ?pwID ?interaction ?source  ?sourceLabel ?target ?targetLabel
              WHERE {
                ?pathway a wp:Pathway .
                ?pathway dc:identifier + ` + pwID + ` .
                ?interaction dcterms:isPartOf ?pathway .
                ?interaction a wp:Interaction .
                ?interaction wp:source ?source .
                ?source rdfs:label ?sourceLabel .
                #?source wp:isAbout ?gpmlSource .
                #?gpmlSource gpml:graphId ?sourceId .
                ?interaction wp:target ?target .
                ?target rdfs:label ?targetLabel .
                #?target wp:isAbout ?gpmlTarget .
                #?gpmlTarget gpml:graphId ?targetId .
                }
                ORDER BY ?pwID`;

// construct URL
 wpURL =  "http://sparql.wikipathways.org/";
 var queryUrl = encodeURI( wpURL + "?query="+query_wp+"&format=json" );

 // Perform WP query
  $.ajax({
    dataType: "jsonp",
    url: queryUrl,
    success: function( _data ) {

      //simplify results
      _data = wdk.simplify.sparqlResults(_data)
      console.log(_data)

      // Create a PATWHAYS object
      //   every pathway is a separate property
      //     every 'pathway' has a 'interacitons' property
      //       every 'interactions' has a 'source' and a 'target' properties
      var pathways = {}

      for (var k = 0; k < _data.length; k++){
        var tempID = "";
        for (var t = 36; t <42; t++){
          if(_data[k].pwID[t] !== undefined )
          tempID = tempID + _data[k].pwID[t]
        }
        if (pathways[tempID] === undefined){
          pathways[tempID] = {interactions: [
            {intID: _data[k].interaction, source: _data[k].source, target: _data[k].target}
        ]}
        }else {
          if (_data[k].interaction != _data[k-1].interaction){
            pathways[tempID].interactions.push({intID: _data[k].interaction, source: _data[k].source, target: _data[k].target})
          }
        }
      }
      console.log(pathways)

      // Stores all interactions
      var all_links = []
      for (var i in pathways) {
          all_links.push(pathways[i].interactions)
      }
      console.log(all_links)

      // Select which pathway we want to visualize the interactions of
      //var links = all_links[5]
      var links = []
      var selected = "WP1603"
      for (var i = 0; i < pathways[selected].interactions.length; i++){
        links.push({source: pathways[selected].interactions[i].source.label,
                    source_link: pathways[selected].interactions[i].soure,
                    target: pathways[selected].interactions[i].target.label,
                    target_link: pathways[selected].interactions[i].target})
      }
      console.log(links)

      // Compute the distinct nodes from the links.
      var nodes = [];

      for (var i = 0; i < links.length; i++) {
          nodes.push({name:links[i].source});
          nodes.push({name:links[i].target});
      }

      // links.forEach(function(link) {
      //   link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
      //   link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
      // });


      var width = 940*2;
          height = 600*2;

      var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);


        // Per-type markers, as they don't inherit styles.
        svg.append("defs").selectAll("marker")
            .data(["suit", "licensing", "resolved"])
          .enter().append("marker")
            .attr("id", function(d) { return d; })
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", -1.5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5");

      var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width, height])
        .linkDistance(100)
        .charge(-800)
        .on("tick", tick)
        .start();

      var path = svg.append("g").selectAll("path")
        .data(force.links())
        .enter().append("path")
        .attr("class", function(d) { return "link " + d.type; })
        .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

      var circle = svg.append("g").selectAll("circle")
        .data(force.nodes())
        .enter().append("circle")
        .attr("r", 15)
        .call(force.drag);

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
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
      }

      function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
      }

    }
 });

}
