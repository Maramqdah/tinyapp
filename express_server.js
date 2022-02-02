const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
var cookieParser = require('cookie-parser');
//app.use(cookieParser());
var cookieSession = require('cookie-session');
const { findUserByEmail } = require("./helpers.js");

app.use(
    cookieSession({
        name: "session",
        keys: ["Some way to encrypt the values", "$!~`yEs123bla!!%"],

    })
);

const bcrypt = require('bcryptjs');

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
        password: bcrypt.hashSync("purple-monkey-dinosaur")
    },
    "user2RandomID": {
        id: "user2RandomID",
        email: "user2@example.com",
        password: bcrypt.hashSync("dishwasher-funk")
    }
};
//====================================================================================================
//--------------------------------------Global Functions
function generateRandomString() {
    const randomShortUrl = (Math.random() + 1).toString(36).substring(6);
    return randomShortUrl;
};

const authenticateUser = function(email, password, users) {
    // retrieve the user from the db
    const userFound = findUserByEmail(email, users);
    // compare the passwords
    // password match => log in
    // password dont' match => error message
    if (userFound && (bcrypt.compareSync(password, userFound.password))) {
        return userFound;
    }
    return false;
};
const urlsForUser = function(id) {
    let result = {};
    for (let shortURL in urlDatabase) {
        if (id === urlDatabase[shortURL].userID) {

            result[shortURL] = urlDatabase[shortURL];
        }
    }

    return result;

}


//================================================================================================

app.post("/urls", (req, res) => {

    const shortUrl = generateRandomString();
    const longUrl = req.body['longURL'];
    urlDatabase[shortUrl] = { longURL: req.body.longURL, userID: req.session.user_id, };

    res.redirect(`/urls/${shortUrl}`);
})

app.get("/urls", (req, res) => {
    const user_id = req.session.user_id;


    if (!user_id) {
        return res.status(403).send("Not logged in");
    }
    const urls = urlsForUser(user_id);

    const templateVars = { urls: urls, user: users[req.session, user_id] };
    res.render("urls_index", templateVars);
});
//------------------------------------------------------------------------------------------------------

app.get("/urls/new", (req, res) => {
    const user_id = req.session["user_id"]
    if (!user_id) {
        return res.redirect("/login");
    }
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);

});

// app.post("/urls/new", (req, res) => {
//   const user_id = req.session.user_id;
//   if (!user_id) {
//     return res.redirect("/login");
//   }
// });

//-------------------------------------------------------------------------------------------------------

app.get("/urls/:shortURL", (req, res) => {

    const userID = req.session.user_id;
    const shortURL = req.params.shortURL;
    const urls = urlsForUser(userID);

    if (!userID) {
        res.status(403).send("not loged in");
    } else if (Object.keys(urls).length === 0) {
        res.status(403).send("short url doesnt blenog to");
    } else if (!urls[shortURL]) {
        res.status(403).send("NO short url")
    }

    const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[userID] };
    res.render("urls_show", templateVars);

});

//for updating URLs
app.post("/urls/:shortURL", (req, res) => {
    const shortURL = req.params.shortURL;
    const longURL = req.body.longURL;
    urlDatabase[shortURL].longURL = longURL;

    res.redirect("/urls");
});
//-------------------------------------------------------------------------------------------------------

app.get("/u/:shortURL", (req, res) => {

    const shortURL = req.params.shortURL;
    const longUrl = urlDatabase[shortURL].longURL;
    res.redirect(longUrl);

});
//-------------------------------------------------------------------------------------------------------
app.post("/urls/:shortURL/delete", (req, res) => {

    const user_id = req.session.user_id;
    const user = users[user_id];
    if (!user) {

        return res.status(403).send("Not loged In");
    }
    const url = urlDatabase[req.params.shortURL];
    if (!url || user.id !== url.userID) {
        return res.status(403).send("URL not exist");

    }

    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
});

//-------------------------------------------------------------------------------------------------------

app.get("/login", (req, res) => {
    if (req.session.user_id) {
        res.redirect("/urls");
    } else {
        const templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
        res.render("urls_login", templateVars);
    }
});

app.post("/login", (req, res) => {

    const email = req.body.email;
    const password = req.body.password;
    if (!findUserByEmail(email, users)) {
        return res.status(403).send("email cannot be found");
    } else if (!authenticateUser(email, password, users)) {
        return res.status(403).send("incorrect password")
    }
    const userFound = findUserByEmail(email, users);

    req.session.user_id = userFound.id;

    res.redirect("/urls");
});

//--------------------------------------------------------------------------------------------------------

app.post("/logout", (req, res) => {
    req.session = null;
    res.redirect("/urls");
});

//------------------------------------------------------------------------------------------------------


app.get("/register", (req, res) => {

    if (req.session.user_id) {
        res.redirect("/urls");
    } else {
        const templateVars = { user: req.session.user_id };

        res.render("register", templateVars);
    }

});

app.post("/register", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).send("add email or password");
        //res.send("add email or password");
    } else if (findUserByEmail(email, users)) {
        return res.status(400).send("email already exist")
    }
    const userId = generateRandomString();
    //console.log("this is the line", userId);
    users[userId] = {
        id: userId,
        email: email,
        password: bcrypt.hashSync(password, 10),
    };
    req.session.user_id = userId;

    res.redirect("/urls");

});

//==============================================================================================

app.listen(PORT, () => {
    // console.log(`Example app listening on port ${PORT}!`);
});
app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});