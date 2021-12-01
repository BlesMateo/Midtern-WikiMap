// load .env data into process.env
require("dotenv").config();

// Web server config
const PORT = process.env.PORT || 8080;
const sassMiddleware = require("./lib/sass-middleware");
const express = require("express");
const app = express();
const morgan = require("morgan");
const cookieSession = require('cookie-session');
const { dataMethod } = require("./dataMethod");
app.use(cookieSession({
  name: 'session',
  keys: ['firstKey', 'secondKey']
}))
// PG database client/connection setup
const { Pool } = require("pg");
const dbParams = require("./lib/db.js");
const db = new Pool(dbParams);
db.connect();

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan("dev"));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(
  "/styles",
  sassMiddleware({
    source: __dirname + "/styles",
    destination: __dirname + "/public/styles",
    isSass: false, // false => scss, true => sass
  })
);

app.use(express.static("public"));

// Separated Routes for each Resource
// Note: Feel free to replace the example routes below with your own
const usersRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const widgetsRoutes = require("./routes/widgets");
const { response } = require("express");

// Mount all resource routes
// Note: Feel free to replace the example routes below with your own
app.use("/api/users", usersRoutes(db));
app.use("/api/auth", authRoutes(db));
app.use("/api/widgets", widgetsRoutes(db));
// Note: mount other resources here, using the same pattern above

// Home page
// Warning: avoid creating more routes in this file!
// Separate them into separate routes files (see above).
2

// app.get('/login', (require, response) => { // to be determined page layout (redirect?)
//   require.session.user = require.query.user;
//   const uLogin = require.session.user;
//   response.redirect('/');
// })

app.get("/login", (req, res) => {
  const uLogin = req.session.user;
  res.render("login", {uLogin});
});

app.post('/login', (req, res) => {
  const userEmail = req.body.email;
  const userPass = req.body.password;
  console.log("=======", req.body);

  if(userEmail === " " && userPass === undefined) {
    res.status(403).send("Please enter your email");
    return;
  }
  if(userEmail === undefined && userPass === " ") {
    res.status(403).send("Please enter your password");
    return;
  }

  let query = `SELECT * FROM users;`;

  db.query(query)
    .then(data => {
      dataMethod(req, response, data.rows);
      return;
    })
    .catch(err => {
      response.status(500).json({error: err.message});
    });

});

app.get("/register", (req, res) => {
  // getUserByEmail("vega@gmail.com", db);
  const uLogin = req.session.user;
  res.render("register", {uLogin});
});

// app.post ("/register", (require, response) => {
//   const userEmail = require.body.userEmail;
//   const userPass = require.body.userPass;
//   if (userPass === undefined && userEmail === " ") {
//     response.status(403).send("Please enter an email address");
//     return;
//   }
//   if (userPass === " " && userEmail === undefined) {
//     response.status(403).send("Please enter your password");
//     return;
//   }
// });

app.post("/logout", (require, response) => {
  require.session = null;
  response.redirect("index");
});

app.get("/maps", (req, res) => {
  console.log(req.query);
  res.render("mapTest", req.query);

});

// Need to complete data base tables before moving forward
// Hardcoded user #1 in our database to test outcome of this map route.
// app.get("/maps", (req, res) => {
//   db.query("SELECT * FROM map WHERE user_id = 1")
//     .then(function (results) {
//       res.json(results.rows);

//     });
// });

//Endpoint - Create map for user
app.post("/map/new", (req, res) => {
  const { userId, title, description } = req.body
  return db
    .query(`INSERT INTO maps (user_id, title, description) VALUES ($1, $2, $3)`, [userId, title, description])

});
// Endpoint - Create a marker
app.post("/map/location_marker", (req, res) => {
  const { long, lat, place_id } = req.body
  return db
    .query(`INSERT INTO location_marker (title, map_id, long, lat, place_id)
    VALUES ($1, $2, $3, $4, $5);`, ["Test", 5, long, lat, place_id])

});

//Throw this function into another file into lib
const addToMaps = function (userId, title, description) {
  return db
    .query(`INSERT INTO maps(user_id, title, description) VALUES($1, $2, $3)
  RETURNING *; `, [userId, title, description])
    .then(res => res.rows);
}


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT} `);
});
