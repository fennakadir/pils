13-11-2019 

- Created GitHub account and repository 
- brainstorm and discuss scientific questions 
- Learn how to edit, validate and view HTML pages 
- worked through examples of SPARQL queries 
- experimented with Wikidata SPARQL queries 

15-11-2019
- figure out how to access external endpoints
- figure out biological question.
    What human pathways contain genes associated with Major Depressive Disorder?
- Match wikidata with biological question
- List the Wikidata properties you need for your SPARQL
  SELECT DISTINCT ?geneLabel ?diseaseLabel ?pathwayLabel 
WHERE {
  ?disease	wdt:P2293 ?gene .    # genetic association between disease and gene
  ?disease wdt:P279*  wd:Q42844 .  # limit to major depressive disorder (the * operator runs up a transitive relation..)
  ?pathway wdt:P31 wd:Q4915012 ;
           wdt:P527 ?gene .
  #?gene wdt:P688 ?gene_product .  # gene_product (usually a protein) is a product of a gene (a region of DNA)
  #?drug wdt:P129 ?pathway .
  

    SERVICE wikibase:label {
        bd:serviceParam wikibase:language "en" .
	}
  }
  
  20-11-19
  - finalize our wikidata query 
 SELECT ?geneLabel ?diseaseLabel ?pathwayLabel ?pathwayID 
 WHERE { ?disease	wdt:P2293 ?gene . 
 ?disease wdt:P279*  wd:Q55950055. 
 ?pathway wdt:P31 wd:Q4915012 ; 
 	wdt:P527 ?gene . 
?pathway wdt:P2410 ?pathwayID 

SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". 
}
- decided to visualize the pathways by accessing the sparql endpoint of wikipathways, and getting the interactions 
and participants of each pathway. wikipathways queries:

- figure out how to link the two queries together in js. The output of the wikidata query (pathway identifiers) are the 
input for the wikipathways query. 

26-11-2019 
- visualize our query data with D3 mobile patent suits
with this we encountered some problems:
	- no directionality 
	- missing components from pathway 
	- only one pathway 
	- elements that interact with themselves, those interactions are not shown 

- trying to change query to also obtain other components pathway 
this was achieved with:
SELECT DISTINCT ?component
WHERE {  VALUES ?pwID {<http://identifiers.org/wikipathways/WP1603>}
       ?pathway a wp:Pathway .
       ?pathway dc:identifier ?pwID .
       ?component dcterms:isPartOf ?pathway 
}
however with this query we need to sort the different results into: interaction, source, target, receptor, 
metabolite etc ourselves with javascrip. 
- then we tried out queries that did that function for us. Turned out to be quite difficult. So we are considering making 2 
queries one for the interaction,source and target. With the other one the components (exclusinf interaction, source and target)
are iterated through with javascript and added to the pathway if they are absent. 
We figured out a query that filters out the source, target and interaction from all the components:
SELECT DISTINCT ?component
WHERE {  VALUES ?pwID {<http://identifiers.org/wikipathways/WP1603>}
       ?pathway a wp:Pathway .
       ?pathway dc:identifier ?pwID .
       ?component dcterms:isPartOf ?pathway . 

       MINUS {
       ?component dcterms:isPartOf ?pathway ;
                  a wp:Interaction . 
       }
       MINUS {
       ?component dcterms:isPartOf ?pathway ;
                  wp:source ?source . 
       }
       MINUS {
       ?component dcterms:isPartOf ?pathway ;
                  wp:target ?target . 
       }

} 

27-11-2019 
- finalising our queries and making sure we can visualise the pathways as accurate as possible.
wikdata: 
SELECT DISTINCT ?geneLabel ?pathwayLabel ?pathwayID ?interaction
                      WHERE { ?disease	wdt:P2293 ?gene .
                        ?disease wdt:P279*  `+ wdID +`.
                        ?pathway wdt:P31 wd:Q4915012 ;
                                 wdt:P527 ?gene .
                        ?pathway wdt:P2410 ?pathwayID .
                        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }}
                        ORDER BY ?pathwayID
			
wiki pathways:
SELECT DISTINCT ?interaction ?source ?sourceLabel ?target ?targetLabel
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
                ORDER BY ?interaction
		
- On top of that we added another layor of complexity by adding another query that queries all the diseases from wikidata 
that has pathways we can visualize. 
second wikidata query:
SELECT DISTINCT ?disease ?diseaseLabel
                  WHERE {
                  ?disease wdt:P31 wd:Q12136 .
                  ?disease	wdt:P2293 ?gene .
                  ?pathway wdt:P31 wd:Q4915012 ;
                            wdt:P527 ?gene .
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
                } ORDER BY ?diseaseLabel

In this way the user can select a disease on our interface, and then select an associated pathway and visualise it. 

29-11 
- last tweaking of the css and start preparing the presentation. 

3-12 
- final practising for the presentation 

