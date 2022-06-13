const express = require("express");
const path = require("path");
const app = express();
const morgan = require("morgan");
const { writeFile, createWriteStream } = require("fs");
const util = require("util");
const json2xls = require("json2xls");

const PORT = process.env.PORT || 5000;
const filePath = path.resolve(__dirname, "./data/searchHistory.xlsx");
const writeFilePromise = util.promisify(writeFile);

const firebase = require("./firebase_module");

// create a write stream (in append mode)
var accessLogStream = createWriteStream(path.join(__dirname, "access.log"), {
  flags: "a",
});
var jsonParser = express.json();
var bodyData;

app.use(express.static("./public")); //Serves resources from public folder
app.use(express.urlencoded({ extended: false })); // to support URL-encoded bodies
app.use(express.json()); // for parsing application/json
app.use(json2xls.middleware); //json to xlsx
app.use(morgan("combined", { stream: accessLogStream }));

app.get("/", (req, res) => {
  res.status(200).sendFile(path.resolve(__dirname, "./index.html"));
});

var currentUser;
var userEmail;

app.post("/", (req, res) => {
  
  var uid;

  if(currentUser == null|| currentUser == undefined){
    uid = "Default";
  }else{
    uid = currentUser.uid;
  }

  const {user} = req.body;
  if(user){
    if(user == userEmail){
      res.status(200).send("logged in");
    }else{
      res.status(200).send("logged out");
    }
  }else{
    let dataObjArray = JSON.parse(JSON.stringify(req.body.data));
    dataObjArray.forEach((dataObj) => {
      let word = dataObj.Word;
      let partOfSpeech = dataObj.PartOfSpeech;
      let phonetics = dataObj.Phonetics;
      let meanings = dataObj.Meanings;
      let synonyms = dataObj.Synonyms;
      let antonyms = dataObj.Antonyms;

      firebase.set(firebase.ref(firebase.db, "/searchHistory/" + uid + "/" + word), {
        word,
        partOfSpeech,
        phonetics,
        meanings,
        synonyms,
        antonyms,
      });
    });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let result;
  if(email !=undefined && password != undefined) {
    result = await loginEmailPassword(email, password);
  }else{
    result = await logout();
  }
  console.log(result);
  res.status(200).send(result);
});

const loginEmailPassword = async (email, password) => {
  try{
    const userCredential = await firebase.signInWithEmailAndPassword(firebase.auth, email, password);
    currentUser = userCredential.user;
    userEmail = userCredential.user.email;
    return userCredential.user.email;
  }catch(error){
    return error.code;
  }
};

app.get("/login", (req, res) => {
  res.status(200).sendFile(path.resolve(__dirname, "./login.html"));
});

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const result = await createAccount(email, password);
  console.log(result);
  res.status(200).send(result);
});

// Create new account using email/password
const createAccount = async (email, password) => {
  try{
    const userCredential = await firebase.createUserWithEmailAndPassword(firebase.auth, email, password);
    currentUser = userCredential.user;
    userEmail = userCredential.user.email;
    return userCredential.user.email;
  }catch(error){
    return error.code;
  }
};

// Monitor auth state
const monitorAuthState = async () => {
  firebase.onAuthStateChanged(firebase.auth, user => {
    if (user) {
      console.log("Observer: logged in")
    }
    else {
      console.log("Observer: logged out")

      //!BUG user account info still stays clientside if server crashes.
    }
  })
}

// Log out
const logout = async () => {
  try{
    await firebase.signOut(firebase.auth);
    currentUser = null;
    return "Logged out";
  }catch(error){
    return error.code;
  }
}

//TODO - Maybe?
app.get("/api/searchHistory", (req, res) => {
  const history = firebase.ref(firebase.db, '/searchHistory/');
  firebase.onValue(history, (snapshot) => {
    const data = snapshot.val();
    res.status(200).json(data);
  });
});

//*****************************************************************************************
// Download button doesnt work on AWS server

// app.post("/download", jsonParser, async (req, res) => {
//   bodyData = req.body.data;
//   let data = JSON.stringify(bodyData);

//   await writeFilePromise(
//     path.resolve(__dirname, "./data/searchHistory.json"),
//     `${data}`,
//     "utf-8"
//   );

//   var xls = json2xls(bodyData);

//   await writeFilePromise(filePath, xls, "binary")
//     .then(() => {
//       res.status(200).send(`${data}`);
//     })
//     .catch((err) => {
//       console.log(err);
//       res.status(500).send("Error");
//     });
// });

// //!BUG - Phonetics column doesnt appear in excel sheet when = "" or undefined.
// app.get("/download", async (req, res) => {
//   res.status(200).xls("data.xlsx", bodyData);
// });

//*****************************************************************************************

app.all("*", (req, res) => {
  res.status(404).sendFile(path.resolve(__dirname, "./404.html"));
});

monitorAuthState();

app.listen(PORT, () => {
  console.log(`server is listening to port ${PORT}`);
});


