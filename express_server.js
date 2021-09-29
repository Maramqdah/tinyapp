const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
var cookieParser = require('cookie-parser');
app.use(cookieParser());


var path = require('path');
const { get } = require("express/lib/response");
const req = require("express/lib/request");
const res = require("express/lib/response");
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
function generateRandomString() {
  const randomShortUrl= (Math.random() + 1).toString(36).substring(6);
  return randomShortUrl;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new",templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
 // console.log(req.body);  // Log the POST request body to the console
 // res.send("Ok");        // Respond with 'Ok' (we will replace this)
 const shortUrl=generateRandomString();
 const longUrl=req.body['longURL'];
 urlDatabase[shortUrl]=longUrl;

 res.redirect(`/urls/${shortUrl}`);
})

app.get("/u/:shortURL", (req, res) => {
  // const longURL = ...
  console.log(req.params);
  const shortURL=req.params.shortURL;
  const longUrl=urlDatabase[shortURL];
  res.redirect(longUrl);

});
app.post("/urls/:shortURL/delete",(req,res)=>{
  //console.log("Deleting");
  //console.log(req.params.shortURL);
  delete urlDatabase[req.params.shortURL];
  console.log(urlDatabase);
 res.redirect("/urls");
});

//for updating URLs
app.post("/urls/:shortURL",(req,res) =>{
const shortURL=req.params.shortURL;
const longURL=req.body.longURL;
urlDatabase[shortURL]=longURL;

res.redirect("/urls");
});

app.post("/login",(req,res)=> {
 console.log(req.body);
 res.cookie("username",req.body.username);
 res.redirect("/urls");

});

app.post("/logout",(req,res)=> {
  console.log(req.body);
  res.clearCookie("username");
  res.redirect("/urls");
 
 });

