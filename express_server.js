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

//=================================================================================================
// Global database
const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "userRandomID"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "userRandomID"
  }
};
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};
//====================================================================================================
//--------------------------------------Global Functions
function generateRandomString() {
  const randomShortUrl= (Math.random() + 1).toString(36).substring(6);
  return randomShortUrl;
};

const findUserByEmail = function (email, users) {
  for (let userId in users) {
    const user = users[userId];
    //console.log(user);
   // console.log(email);
    //console.log(user.email === email);
    if (user.email === email) {
      return user;
    }
  }
  return null;  
};
const authenticateUser = function (email, password, users) {
  // retrieve the user from the db
  const userFound = findUserByEmail(email, users);
  // compare the passwords
  // password match => log in
  // password dont' match => error message
  if (userFound && userFound.password === password) {
    return userFound;
  }
  return false;
};
const urlsForUser = function(id){
  let result={};
 for(let shortURL in urlDatabase){
   if(id === urlDatabase[shortURL].userID){

   result[shortURL] = urlDatabase[shortURL];
  }
 }
 //console.log("THIS IS WHAT WE WANT", result);
 return result;
 
}

//==============================================================================================

app.listen(PORT, () => {
 // console.log(`Example app listening on port ${PORT}!`);
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
//================================================================================================

app.post("/urls", (req, res) => {

  const shortUrl=generateRandomString();
  const longUrl=req.body['longURL'];
  //urlDatabase[shortUrl].longURL=longUrl;
  urlDatabase[shortUrl] = {longURL: req.body.longURL, userID: req.cookies.user_id, };

  //console.log("here")
  //console.log("longurl",longUrl);
  //urlDatabase[shortUrl].userId=user_id;
 
  res.redirect(`/urls/${shortUrl}`);
 })

app.get("/urls", (req, res) => {
 const user_id = req.cookies["user_id"]
 if(!user_id)
 {
   return res.status(403).send("Not logged in");
 }
const urls= urlsForUser(user_id);

  const templateVars = { urls: urls, username: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});
//------------------------------------------------------------------------------------------------------

app.get("/urls/new", (req, res) => { 
  const user_id = req.cookies["user_id"]
if(!user_id)
{
  return res.redirect("/login");
}
const templateVars = { username: users[req.cookies["user_id"]] };
res.render("urls_new",templateVars);
  
});

app.post("/urls/new",(req,res)=>{
const user_id = req.cookies["user_id"]
if(!user_id)
{
  return res.redirect("/login");
}
});

//-------------------------------------------------------------------------------------------------------

app.get("/urls/:shortURL", (req, res) => {

   const userID=req.cookies.user_id;
   const shortURL=req.params.shortURL;
   //const url = urlDatabase[req.params.shortURL];
   const urls=urlsForUser(userID);

   //console.log("USERID",userID);
   if(!userID){
     res.status(403).send("not loged in");
   }else if(Object.keys(urls).length === 0){
    res.status(403).send("short url doesnt blenog to");
   }else if(!urls[shortURL]){
     res.status(403).send("NO short url")
   }
   
  //console.log(req.params.shortURL);
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, username :users[userID]};
  res.render("urls_show", templateVars);
 // console.log("email:",users[userID] );
});

//for updating URLs
app.post("/urls/:shortURL",(req,res) =>{
  const shortURL=req.params.shortURL;
  const longURL=req.body.longURL;
  urlDatabase[shortURL].longURL=longURL;
  
  res.redirect("/urls");
  });
//-------------------------------------------------------------------------------------------------------

app.get("/u/:shortURL", (req, res) => {
  // const longURL = ...
  //console.log(req.params);
  const shortURL=req.params.shortURL;
  const longUrl=urlDatabase[shortURL].longURL;
  res.redirect(longUrl);

});
//-------------------------------------------------------------------------------------------------------
app.post("/urls/:shortURL/delete",(req,res)=>{
  //console.log("Deleting");
  //console.log(req.params.shortURL);
  const user_id=res.body.cookies;
  delete urlDatabase[req.params.shortURL];
  //console.log(urlDatabase);
 res.redirect("/urls");
});

//-------------------------------------------------------------------------------------------------------

app.get("/login",(req,res) =>{
const templateVars = { urls: urlDatabase, username: users[req.cookies["user_id"]] };
res.render("urls_login",templateVars);
});

app.post("/login",(req,res)=> {

const email= req.body.email;
const password= req.body.password;
if(!findUserByEmail(email,users)){
  return res.status(403).send("email cannot be found");
}else if(!authenticateUser(email,password,users)){
  return res.status(403).send("incorrect password")
}
const userFound = findUserByEmail(email, users);
//console.log("userFound", userFound);
//console.log("userid",req.body)
res.cookie("user_id",userFound.id);// settting cookies with user_id
res.redirect("/urls");
});

//--------------------------------------------------------------------------------------------------------

app.post("/logout",(req,res)=> {
  //console.log(req.body);
  res.clearCookie("user_id");
  res.redirect("/urls");
 });

 //------------------------------------------------------------------------------------------------------


 app.get("/register",(req,res)=> {

  const templateVars = { username: req.cookies["user_id"] };
  res.render("register",templateVars);

 });

app.post("/register",(req,res)=>{
const email=req.body.email;
const password=req.body.password;

if(!email || !password){
  return res.status(400).send("add email or password");
  //res.send("add email or password");
}
  else if(findUserByEmail(email,users)){
   return res.status(400).send("email already exist")
  }
 const userId = generateRandomString();
 users[userId] = {
  id: userId,
  email: req.body.email,
  password: req.body.password,
};
res.cookie('user_id', userId);
res.redirect("/urls");

 });

