Hypermedia
==========

## Introduction

### "Affordance"

Psychologist James J. Gibson introduced the term "affordances" in the 1977 article "The Theory of Affordances" and
later as a chapter in his 1986 book "The Ecological Approach to Visual Perception."
The affordances of the environment are what it offers ... what it provides or furnishes, either for good or ill.
The verb 'to afford' is found in the dictionary, but the noun 'affordance' is not. I have made it up (page 126).

[source]: http://en.wikipedia.org/wiki/Affordance
[source]: http://en.wikipedia.org/wiki/James_J._Gibson

Don Norman used the term "affordances" in 1988 in his book "The [Design|Psychology] of Everyday Things."
"...the term affordance refers to the perceived and actual properties of the thing, primarily those fundamental
properties that determine just how the thing could possibly be used. (pg 9)"

[source]: http://en.wikipedia.org/wiki/Donald_Norman

Roy Fielding used the term "affordance" in 2008 Presentation on REST.
"When I say Hypertext, I mean the simultaneous presentation of information and controls such that the information
becomes the affordance through which the user obtains choices and selects actions (slide #50)."

[source]: http://www.slideshare.net/royfielding/a-little-rest-and-relaxation
[source]: http://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven

### This Module

- Node.JS and XMLHttpRequest runtime environment support. (No Browserify needed. No 3rd party dependencies.)
- RFC 2046 Multipart grammar compliant encoder and decoder.
- RFC 3986 Uniform Resource Identifier (URI) grammar compliant encoder and decoder.
- Hypermedia media type called Navigation Application Language (NavAL).
- Protocol-agnostic API DSL (Default is HTTP).
- Protocol (Default is HTTP) client that normalizes request and response interfaces between Node.JS and XMLHttpRequest.
- CORS preflight and simple request and response middleware.
- A way to augment hypermedia affordances into any response entity body losslessly using
  Multipart/Nav-Data and Application/NavAL+JSON.
- A way to enter any hypermedia API and follow "link" and "form" affordances within responses.

### Example API

    {
        "cors": ["*"],
        "apis": [
            {
                "title": "Get all todos.",
                "id": "getTodos",
                "method": "GET",
                "uri": "/todos"
            },
            {
                "title": "Get a todo.",
                "id": "getTodo",
                "method": "GET",
                "uri": "/todos/{id}"
            },
            {
                "title": "Create a todo.",
                "id": "createTodo",
                "method": "POST",
                "uri": "/todos",
                "headers": {
                    "content-type": "application/json"
                },
                "body": [
                    {
                        "title": "Title of the todo.",
                        "name": "title",
                        "value": "",
                        "type": "text"
                    },
                    {
                        "title": "Due date of the todo.",
                        "name": "due",
                        "value": "",
                        "type": "date"
                    },
                    {
                        "title": "Description of the todo.",
                        "name": "description",
                        "value": "",
                        "type": "text"
                    }
                ]
            },
            {
                "title": "Upsert a todo.",
                "id": "upsertTodo",
                "method": "PUT",
                "uri": "/todos/{id}",
                "headers": {
                    "content-type": "application/json"
                },
                "body": [
                    {
                        "title": "Title of the todo.",
                        "name": "title",
                        "value": "",
                        "type": "text"
                    },
                    {
                        "title": "Due date of the todo.",
                        "name": "due",
                        "value": "",
                        "type": "date"
                    },
                    {
                        "title": "Description of the todo.",
                        "name": "description",
                        "value": "",
                        "type": "text"
                    }
                ]
            },
            {
                "title": "Delete a todo.",
                "id": "deleteTodo",
                "method": "DELETE",
                "uri": "/todos/{id}"
            }
        ]
    }

## Installation

    npm install hypermedia --save

## Usage

Browser Usage

    <script src="path/to/index.js"></script>
    <script>
        var agent = hypermedia.Api.enter('http://0.0.0.0:8080/', function (error, res) {});
    </script>

Node.JS Usage

    var agent = require('hypermedia').Api.enter('http://0.0.0.0:8080/', function (error, res) {});

## Tests

No unit tests are currently present. Eventually:

    npm test

## Contributing

In lieu of a formal style guideline, take care to maintain the existing coding style.
