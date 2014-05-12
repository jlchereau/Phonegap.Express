REM goto current directory
cd /d %~dp0
REM install global packages
REM npm install -g phonegap
REM npm install -g grunt-cli
npm install -g mocha
REM install dependencies listed in package.json
npm install