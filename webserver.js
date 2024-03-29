var express = require("express");
module.exports = function() {
    let webapp = module.exports.webapp;
    webapp = express();
    webapp.on("error", (parent) => {
        console.log("something went wrong when running web server");
    });
    webapp.use(express.static("public"));
    webapp.get("/", (req, res) => {
        res.redirect("/index.html");
    });
    webapp.get("/index.html", (req, res) => {
        res.redirect("/game.html");
    });
    var port = 8080;
    webapp.listen(port, function() { console.log("webserver running (port 82) (ex. http://127.0.0.1:" + port + " )"); })
    return webapp;
};