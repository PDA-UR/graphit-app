import { Service } from "@tsed/di";

/**
 * SPARQL-Query for retrieving a graph for courses that connect to items using "subclass of" (e.g. CGBV 23SS)
 * @param userId Id of the user
 * @returns The user graph
 */
const subClassCourse = (
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
  # ?sourceResource ?sourceResourceLabel ?sourceResourceUrl
  # ?dependencyResource ?dependencyResourceLabel ?dependencyResourceUrl
WHERE {
  # Retrieve the source node and its dependent node
  ?source wdt:P1 ?dependency.
  
  # Retrieve the class of the source node (if P2: subclass of ) -> only cgbv
  ?source wdt:P2 ?sourceNodeClass.
  # OPTIONAL {?source wdt:P2 ?sourceNodeClass.} # + all other items (curr in diff query)
  
  # Retrieve the image of the source node (if available)
  OPTIONAL { ?source wdt:P9 ?sourceNodeImage. }
  
  # Retrieve the class of the dependent node (if available)
  OPTIONAL { ?dependency wdt:P2 ?dependencyNodeClass. }
  
  # Retrieve the image of the dependent node (if available)
  OPTIONAL { ?dependency wdt:P9 ?dependencyNodeImage. }


  # Retrieve the resources of the source 
  # OPTIONAL {?source wdt:P21 ?sourceResource.
  #           ?sourceResource wdt:P20 ?sourceResourceUrl.}
  
  # Retrieve the resources of the dependency 
  # OPTIONAL {?dependency wdt:P21 ?dependencyResource.
  #           ?dependencyResource wdt:P20 ?dependencyResourceUrl.}
  

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
// TODO, for specific course only
const resourceQuery = (
	userId = "Q157",
  courseId = "Q926"
) => `# Retrieve all Resources and Items their linked to
PREFIX wdt: <https://graphit.ur.de/prop/direct/>
PREFIX wd: <https://graphit.ur.de/entity/>
SELECT ?source ?sourceLabel 
       ?resource ?resourceLabel 
       ?resourceUrl ?resourceType ?resourceTypeLabel
       ?resourceCompleted ?resourceInterested
WHERE {

  # get only the resources linked to by item inside the course
  wd:${courseId} wdt:P14/wdt:P14 ?source.
  
  # Retrieve Items and their linked Resources
  ?source wdt:P21 ?resource. 
  
  # Retrieve the url(P20) of the Resource
  ?resource wdt:P20 ?resourceUrl.
  
  # Retrieve the instance of (P3) the Resource (e.g. Article, Code example)
  ?resource wdt:P3 ?resourceType.
  
  # Check if the dependent node has completed (Property P12)
  BIND(EXISTS { wd:${userId} wdt:P12 ?resource } AS ?resourceCompleted)
  
  # Check if ${userId} is interested in the dependent node (Property P23)
  BIND(EXISTS { wd:${userId} wdt:P23 ?resource } AS ?resourceInterested)
  
  service wikibase:label { bd:serviceParam wikibase:language "en" }
}
`;

// Course-query for all courses that use "includes" to link to childs
const courseQuery = (
    userId = "Q157",
    courseId = "Q468",
) => `# Retrieve all items that are part of the Course "Wissenschaftliches Arbeiten"
PREFIX wdt: <https://graphit.ur.de/prop/direct/>
PREFIX wd: <https://graphit.ur.de/entity/>
SELECT DISTINCT 
?session ?sessionLabel
?sourceDate
?source ?sourceLabel ?sourceDesc
?dependencyDate
?dependency ?dependencyLabel ?dependencyDesc
?sourceGoal 
?sourceInterested ?sourceCompleted
?dependencyInterested ?dependencyCompleted
WHERE {
  # SELECT ALL elements INCLUDED in <Course>
  BIND (wd:${courseId} as ?sourceCourse).
  ?sourceCourse wdt:P14 ?session.
  ?session wdt:P3 wd:Q427. # force session
  ?session wdt:P14 ?item.  # use as stand-in for getting ?sources and ?dependencies (BIND these explicitly)

  # ----- (NON) DEPENDENCIES ----- #

  # UNION the result of...
  OPTIONAL {
  {
    # get the dependencies outside of sessions (i.e. items in session, dep. outside)
    ?item wdt:P1 ?topic.
    ?topic wdt:P1 ?post.
    BIND (?topic as ?source)
    BIND (?post as ?dependency)
  } UNION {
    # get dependencies "recursively" as long as the ?item is in a session.
    ?item wdt:P1 ?topic.
    BIND (?item as ?source)
    BIND (?topic as ?dependency) 
  } 
    # Check the User-Queries on the already existing ?dependencies [*]
    BIND(EXISTS { wd:${userId} wdt:P12 ?dependency } AS ?dependencyCompleted) 
    BIND( EXISTS { wd:${userId} wdt:P23 ?dependency } AS ?dependencyInterested) 
  }
  # NOTE: both operations don't seem to work without union...
    
  # get items that don't have any dependencies
  OPTIONAL {
    ?item !wdt:P1 ?topic.
    BIND (?item as ?source)
  }
  
  # Query gets really slow with descriptions included
  # OPTIONAL { ?source schema:description ?sourceDesc. }  
  # OPTIONAL { ?dependency schema:description ?dependencyDesc. }  
  # NOTE: goals are called ?sourceGoals for parsing later, but are just regular goals of the course
  OPTIONAL { BIND (EXISTS{ ?sourceCourse wdt:P36 ?source.} AS ?sourceGoal). }

  # ----- PARSED DATES ----- #
  # NOTE: any item that "has a date" is included in a session, and will at one point be queried as a ?source
  # -> you shouldn't need to get the date of a ?dependency, that are only ?dependencies as they are not included in a session anyway
  OPTIONAL { 
    ?session wdt:P19 ?sDate.
    BIND( (concat(substr(?sDate, 9, 2), '.', substr(?sDate, 6, 2), '.', substr(?sDate, 1, 4))) as ?sourceDate).
  }


  # ----- USER QUERIES (SOURCES) for dependencies see: [*]----- #

  # Check if ${userId} is interested in the source node (Property P23)
  BIND(EXISTS { wd:${userId} wdt:P23 ?source } AS ?sourceInterested)

  # Check if the source node has completed (Property P12)
  BIND(EXISTS { wd:${userId} wdt:P12 ?source } AS ?sourceCompleted)

  service wikibase:label { bd:serviceParam wikibase:language "en" }
}
`;

/**
 * [*]
 * NOTE: on the User-Queries for ?dependency:
 * Because not all ?sources have ?dependencies, checking if a user have "completed/is interested" removes all these ?dependency-less ?sources.
 * So those checks are done before these ?sources get added to the result.
 * Optionally you could BIND an arbitrary value to the empty ?dependencies and the use the same syntax as the ?sources.
 * i.e:
 * BIND (IF(!BOUND(?dependency), "1", ?dependency) as ?dependency) 
 * BIND (IF(?dependency = "1", "false", EXISTS { wd:${userId} wdt:P23 ?dependency } ) AS ?dependencyInterested ) 
 */ 



// Query returns all resources for one item
const itemResource = (
  qid = "Q21",
) => `PREFIX wdt: <https://graphit.ur.de/prop/direct/>
PREFIX wd: <https://graphit.ur.de/entity/>
SELECT DISTINCT ?resource ?resourceLabel ?description ?alias ?url ?type ?typeLabel
WHERE {
  # Select all resources and their types for a specific item
  BIND (wd:${qid} as ?item).
  ?item wdt:P21 ?resource.
  OPTIONAL{?resource schema:description ?description.}
  OPTIONAL{?resource skos:altLabel ?alias.}
  ?resource wdt:P20 ?url.  
  OPTIONAL {?resource wdt:P3 ?type.}

  service wikibase:label { bd:serviceParam wikibase:language "en". }
}`

/**
 * Return all the courses a student "participates in"
 * @param studentName 
 */
const coursesTaken = (
  userId = "Q157",
) => `
PREFIX wdt: <https://graphit.ur.de/prop/direct/>
PREFIX wd: <https://graphit.ur.de/entity/>

SELECT ?course ?courseLabel ?courseId WHERE {
  VALUES ?student {wd:${userId}}
  ?student wdt:P25 ?course.

  # extract the last path segment of the URI (see: https://stackoverflow.com/a/74258245)
  BIND(STRAFTER(STR(?course), STR(wd:)) AS ?courseId) .
           
SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}`;

/**
 * Check if an item is "included in" a course the user "participates in"
 * @param qid the QID of the item to check
 * @param userId the QID of the current users wikibase-item
 * @returns all courses that match
 */
const itemInclusion = (
  qid: string,
  userId: string,
) => `
PREFIX wdt: <https://graphit.ur.de/prop/direct/>
PREFIX wd: <https://graphit.ur.de/entity/>
SELECT DISTINCT ?course ?courseLabel WHERE {
  BIND (wd:${qid} as ?item)
  BIND (wd:${userId} as ?user)
  ?user wdt:P25 ?course.
  ?course wdt:P14/wdt:P14 ?item.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
} LIMIT 100
`;

/**
 * Check which role a user connected to them in the graph (i.e. their role or class)
 * @param userId the QID of the current users wikibase-item
 * @returns All items a user is an "instance of"
 */
const userRole = (
  userId: string,
) => `
PREFIX wdt: <https://graphit.ur.de/prop/direct/>
PREFIX wd: <https://graphit.ur.de/entity/>
SELECT ?user ?userLabel ?role ?roleLabel WHERE {
  BIND (wd:${userId} as ?user)
  ?user wdt:P3 ?role.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
`;

/**
 * Check if an item is a Person-Item (e.g. Student)
 * @param qid of the item to check for
 * @returns the role of the Person or Nothing (if not a person)
 */
const isPerson = (
  qid: string,
) => `
#defaultView:Table
PREFIX wdt: <https://graphit.ur.de/prop/direct/>
PREFIX wd: <https://graphit.ur.de/entity/>
SELECT ?user ?userLabel ?role ?roleLabel WHERE {
  BIND (wd:${qid} as ?user)
  ?user wdt:P3 ?role.
  ?role ^wdt:P14 wd:Q1985.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
`

/**
 * @returns all exiting course, that contain at least one session
 */
const existingCourses = () => `
  PREFIX wdt: <https://graphit.ur.de/prop/direct/>
  PREFIX wd: <https://graphit.ur.de/entity/>
  SELECT DISTINCT ?course ?courseLabel
  WHERE {
  ?course wdt:P3 wd:Q170.
  ?course wdt:P14 ?session.
  ?session wdt:P3 wd:Q427.
 
  service wikibase:label { bd:serviceParam wikibase:language "en".}
} ORDER BY ASC(?courseLabel)
`;

/**
 * Returns all labels that contain a given string (case-insensitive)
 * @param label The string to check against
 * @param lang The language of the labels to match, e.g.: en, de (default: en)
 * @param limit How many results to return (default: 10)
 * @returns 
 */
const getLabelMatches = (
  label: string,
  lang: string = "en",
  limit: number = 10,
) => `
PREFIX wd: <https://graphit.ur.de/entity/>
PREFIX wdt: <https://graphit.ur.de/prop/direct/>
SELECT DISTINCT ?item ?itemLabel WHERE {
  ?item rdfs:label ?itemLabel.
  FILTER REGEX( ?itemLabel, "${label}", "i" )
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],${lang}". }
} LIMIT ${limit}
`;


/**
 * Service for retrieving SPARQL-Queries
 */
@Service()
export class SparqlQueryTemplateService {
	public getSubClassCourse(userId: string) {
		return subClassCourse(userId);
	}

	public getCategoriesQuery() {
		return categoriesQuery();
	}

	public getResources(userId: string, courseId: string) {
		return resourceQuery(userId, courseId);
	}

  public getCourseQuery(userId: string, courseId: string){
    return courseQuery(userId, courseId);
  }

  public getItemResource(qid: string) {
    return itemResource(qid)
  }

  public getCoursesTaken(userId: string) {
    return coursesTaken(userId);
  }

  public getItemInclusion(qid: string, userId:string ) {
    return itemInclusion(qid, userId);
  }

  public getUserRole(userId:string) {
    return userRole(userId);
  }

  public getIsPerson(qid:string) {
    return isPerson(qid);
  }

  public getExistingCourses() {
    return existingCourses();
  }

  public getLabelMatches(label:string, lang:string = "en", limit:number = 10) {
    return getLabelMatches(label, lang, limit)
  }
}