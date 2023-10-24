import { Service } from "@tsed/di";

/**
 * SPARQL-Query for retrieving the user graph.
 * ONLY WORKS IN PRODUCTION INSTANCE BECAUSE OF THE HARDCODED PROPERTY IDS
 * @param userId Id of the user
 * @returns The user graph
 */
const userGraph = (
	userId = "Q157"
) => `PREFIX wd: <https://graphit.ur.de/entity/>
PREFIX wdt: <https://graphit.ur.de/prop/direct/>
SELECT 
  ?source ?sourceLabel 
  ?sourceNodeClass ?sourceNodeClassLabel ?sourceNodeImage 
  ?dependency ?dependencyLabel
  ?dependencyNodeClass ?dependencyNodeClassLabel ?dependencyNodeImage
  ?sourceCompleted ?dependencyCompleted
  ?sourceInterested ?dependencyInterested
WHERE {
  # Retrieve the source node and its dependent node
  ?source wdt:P1 ?dependency.
  
  # Retrieve the class of the source node (if P2: subclass of )
  ?source wdt:P2 ?sourceNodeClass.
  # OPTIONAL {?source wdt:P2 ?sourceNodeClass.}
  # NOTE: All items with a NodeClass are items of the course: cgbv
  
  # Retrieve the image of the source node (if available)
  OPTIONAL { ?source wdt:P9 ?sourceNodeImage. }
  
  # Retrieve the class of the dependent node (if available)
  OPTIONAL { ?dependency wdt:P2 ?dependencyNodeClass. }
  
  # Retrieve the image of the dependent node (if available)
  OPTIONAL { ?dependency wdt:P9 ?dependencyNodeImage. }
  
  # Check if the source node has completed (Property P12)
  BIND(EXISTS { wd:${userId} wdt:P12 ?source } AS ?sourceCompleted)
  
  # Check if the dependent node has completed (Property P12)
  BIND(EXISTS { wd:${userId} wdt:P12 ?dependency } AS ?dependencyCompleted)
  
  # Check if ${userId} is interested in the source node (Property P23)
  BIND(EXISTS { wd:${userId} wdt:P23 ?source } AS ?sourceInterested)
  
  # Check if ${userId} is interested in the dependent node (Property P23)
  BIND(EXISTS { wd:${userId} wdt:P23 ?dependency } AS ?dependencyInterested)
  
  # Retrieve labels for all entities in the preferred language (fallback to English)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en".}
}

`;

// Separate SPARQL-Query for getting category nodes
const categoriesQuery = () => `#defaultView:Graph
PREFIX wd: <https://graphit.ur.de/entity/>
PREFIX wdt: <https://graphit.ur.de/prop/direct/>
SELECT ?itemLabel
  WHERE {
  # Retrieve all items that are an instance of (P3) a category (Q169)
  ?item wdt:P3 wd:Q169

  # Retrieve labels for all entities in the preferred language (fallback to English)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en".}
}`;

// Query for retrieving ALL Resources and their links
const resourceQuery = (
	userId = "Q157"
) => `# Retrieve all Resources and Items their linked to
PREFIX wdt: <https://graphit.ur.de/prop/direct/>
PREFIX wd: <https://graphit.ur.de/entity/>
SELECT ?source ?sourceLabel ?dependency ?dependencyLabel 
       ?dependencyUrl ?dependencyResourceType ?dependencyRypeLabel
       ?dependencyCompleted ?dependencyInterested
WHERE {
  
  # Retrieve Items and their linked Resources
  ?source wdt:P21 ?dependency. 
  
  # Retrieve the url(P20) of the Resource
  ?dependency wdt:P20 ?dependencyUrl.
  
  # Retrieve the instance of (P3) the Resource (e.g. Article, Code example)
  ?dependency wdt:P3 ?dependencyResourceType.
  
  # Check if the dependent node has completed (Property P12)
  BIND(EXISTS { wd:${userId} wdt:P12 ?dependency } AS ?dependencyCompleted)
  
  # Check if ${userId} is interested in the dependent node (Property P23)
  BIND(EXISTS { wd:${userId} wdt:P23 ?dependency } AS ?dependencyInterested)
  
  service wikibase:label { bd:serviceParam wikibase:language "en" }
}
`;

// Temporary query for WissArb-Graph
const wissGraph = (
    userId = "Q157",
) => `# Retrieve all items that are part of the Course "Wissenschaftliches Arbeiten"
PREFIX wdt: <https://graphit.ur.de/prop/direct/>
PREFIX wd: <https://graphit.ur.de/entity/>
SELECT DISTINCT 
?sourceCourse ?sourceCourseLabel
?item ?itemLabel
?itemType ?itemTypeLabel
?source ?sourceLabel
?dependency ?dependencyLabel
?sourceCompleted ?dependencyCompleted
?sourceInterested ?dependencyInterested
WHERE {
{
  # SELECT ALL elements INCLUDED in <Course>
  { SELECT distinct * WHERE {
    BIND (wd:Q468 as ?sourceCourse).
    # Retrieve all items in the course
    ?sourceCourse wdt:P14 ?item. # = session or category
    #?item wdt:P14 ?itemType.
    ?item wdt:P14 ?source.
  } 
  }
  ?source wdt:P1+ ?dependency.
  }
  
  # Check if the source node has completed (Property P12)
  BIND(EXISTS { wd:${userId} wdt:P12 ?source } AS ?sourceCompleted)
  
  # Check if the dependent node has completed (Property P12)
  BIND(EXISTS { wd:${userId} wdt:P12 ?dependency } AS ?dependencyCompleted)
  
  # Check if ${userId} is interested in the source node (Property P23)
  BIND(EXISTS { wd:${userId} wdt:P23 ?source } AS ?sourceInterested)
  
  # Check if ${userId} is interested in the dependent node (Property P23)
  BIND(EXISTS { wd:${userId} wdt:P23 ?dependency } AS ?dependencyInterested)
  
  service wikibase:label { bd:serviceParam wikibase:language "en" }
}
`;

/**
 * Service for retrieving SPARQL-Queries
 */
@Service()
export class SparqlQueryTemplateService {
	public getUserGraph(userId: string) {
		return userGraph(userId);
	}

	public getCategoriesQuery() {
		return categoriesQuery();
	}

	public getResources(userId: string) {
		return resourceQuery(userId);
	}

  public getWissGraph(userId: string){
    return wissGraph(userId);
  }
}
