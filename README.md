#Phonegap.Express

> Phonegap Express is a prototype built on MongoDB, nodeJS and Kendo UI to demonstrate accessing a RESTful JSON api secured with oAuth 2.0 from browsers and Phonegap

![Web Application](https://raw.githubusercontent.com/jlchereau/Phonegap.Express/master/docs/webapp.png "Web Application")

##Architecture and directories

![Architecture](https://raw.githubusercontent.com/jlchereau/Phonegap.Express/master/docs/architecture.png "Architecture")

This project includes two applications:

- server.js, config\ and api\ make the nodesJS + ExpressJS RESTful API server,
- www\ is the html5 application delivered to the browser or packaged as a Phonegap application

##Requirements

- Install mongoDB from http://www.mongodb.org/downloads
- Install nodejs from http://nodejs.org/download/
- Run setup.cmd (on Windows)

##Configuration

### API server address

You can change the IP port of the API server at https://github.com/jlchereau/Phonegap.Express/blob/master/config/development.json

The client (browser or Phonegap) gets the location of the API server from https://github.com/jlchereau/Phonegap.Express/blob/master/www/js/api.js#L40

Windows Live does not authorize localhost as an application server, which can be worked around by configuring %SystemRoot%\system32\drivers\etc\hosts

### oAuth provider configuration

Follow the instructions at:

- Facebook: https://developers.facebook.com/apps/
- Google: https://console.developers.google.com/project
- Twitter: https://apps.twitter.com/app/
- Windows Live: https://account.live.com/developers/applications
- Yahoo?

Then update the clientID and clientSecret for all providers in https://github.com/jlchereau/Phonegap.Express/blob/master/config/development.json

##Execution and tests

The html 5 web application is available at:
- http://dl.dropboxusercontent.com/u/32824246/phonegap.express/index.html
- http://expressjs.herokuapp.com/index.html

The JSON RESTful api is only available at http://expressjs.herokuapp.com
It can be tested at http://expressjs.herokuapp.com/heartbeat

##Copyright

Copyright (c) 2013-2014 Memba Sarl.

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
