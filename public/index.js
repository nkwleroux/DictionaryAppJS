const wrapper = document.querySelector(".wrapper");
const searchInput = wrapper.querySelector("input");
const volume = wrapper.querySelector(".word i");
const infoText = wrapper.querySelector(".info-text");
const removeIcon = wrapper.querySelector(".search span");
const content = wrapper.querySelector("ul .content");
// const downloadBtn = document.getElementById("downloadBtn");
const accountBtn = document.getElementById("accountBtn");
const history = document.querySelector(".sidebar .list");
//!BUG user account info still stays clientside if server crashes.
const accountDetail = document.getElementById("accountDetail");
let audio;

const wordsList = wrapper.querySelector(".wordsList .list");
const synonyms = wrapper.querySelector(".synonyms .list");
const antonyms = wrapper.querySelector(".antonyms .list");

let list = [];

let user;

//debug (calls onLoad + my own funciton)
document.addEventListener("DOMContentLoaded", function () {

  if(accountDetail.innerHTML == "No account" || accountDetail.innerHTML == undefined){
    accountDetail.style.display = "none";
  };

  user = localStorage['user'];

  console.log(user);

  if(user != undefined && user != ""){
    var url = "/"; // The backend URL which expects your data

    let xmlhttp = new XMLHttpRequest(); // new HttpRequest instance
    xmlhttp.open("POST", url, true);

    // Set the request format
    xmlhttp.setRequestHeader("Accept", "application/Json");
    xmlhttp.setRequestHeader("Content-Type", "application/Json");

    //When data is recieved from the server
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
        console.log(xmlhttp.responseText);
        if(xmlhttp.responseText == "logged in"){
          accountDetail.style.display = "block";
          accountDetail.innerHTML = user;
          accountBtn.innerHTML = "Logout";
        }else{
          accountDetail.innerHTML = "No account";
          accountDetail.style.display = "none";
          accountBtn.innerHTML = "Log in";
          history.innerHTML = "";
          searchInput.value = "";
          wrapper.classList.remove("active");
          infoText.innerHTML = ``;
        }
      }
    };

    jsonData = JSON.stringify({
      user: user,
    });

    xmlhttp.send(jsonData);
  }

  if (searchInput.value != undefined && searchInput.value != "") {
    search(searchInput.value);
  };

});

content.addEventListener("resize", function () {
  let height = content.offsetHeight;
  let width = content.offsetWidth;
  console.log(height);
  console.log(width);
});

function addToListSidebar(word){
  let wordSearched = word.replace(/^\w/, (c) => c.toUpperCase());
  list.push(word);

  let tag = `<span onclick="search('${word}')">${wordSearched}</span>`;
  const sidebar = document.querySelector(".sidebar .list");
  sidebar.insertAdjacentHTML("afterbegin", tag);
}

async function data(result) {
  wrapper.classList.add("active");

  //Word
  let wordSearched = result[0].word.replace(/^\w/, (c) => c.toUpperCase());
  document.querySelector(".word strong").innerText = wordSearched;

  if (!list.includes(result[0].word)) {
    addToListSidebar(result[0].word);

    //database data (post request)
    var url = "/"; // The backend URL which expects your data

    var xmlhttp = postDataRequest(url);

    //When data is recieved from the server
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
        console.log("home page");
      }
    };

    var jsonData = await getWordListData(list);
    let dataArray = mapJsonDataToArray(jsonData);

    // JSON encode the data by stringifying it before sending to the server
    xmlhttp.send(JSON.stringify(dataArray));
  }

  //TODO - DOESNT WORK
  // localStorage.removeItem("list");
  // localStorage.setItem("list", JSON.stringify(list));

  //Phonetics
  let phontetics = "";
  if (
    result[0].meanings[0].partOfSpeech != "" &&
    result[0].meanings[0].partOfSpeech != undefined
  ) {
    phontetics = `${result[0].meanings[0].partOfSpeech}  `;
  }
  if (
    result[0].phonetics[0] != undefined &&
    result[0].phonetics[0].text != "" &&
    result[0].phonetics[0].text != undefined
  ) {
    phontetics += `${result[0].phonetics[0].text}`;
  }
  document.querySelector(".word span").innerText = phontetics;

  volume.style.display = "none";
  if (result[0].phonetics[0] != undefined) {
    audio = new Audio(result[0].phonetics[0].audio);

    audio.addEventListener("canplaythrough", (event) => {
      volume.style.display = "block";
    });
  }

  //Words
  wordsList.innerHTML = "";
  let definitions = result[0].meanings[0].definitions;
  let tag;
  for (let index = 0; index < definitions.length; index++) {
    tag = `<li>
        <p> ${index + 1}. ${definitions[index].definition}</p>
      `;
    if (definitions[index].example != undefined) {
      tag += `<span> Example: ${definitions[index].example}</span>`;
    }
    tag += `</li>`;
    wordsList.insertAdjacentHTML("beforeend", tag);
  }

  //synonyms
  let wordSynonyms = result[0].meanings[0].synonyms;
  addLinkedRelatedWords(synonyms, wordSynonyms);

  //antonyms
  let wordAntonyms = result[0].meanings[0].antonyms;
  addLinkedRelatedWords(antonyms, wordAntonyms);

  setSidebarHeight();
}

function setSidebarHeight() {
  var height = convertPixelsToRem(
    document.getElementById("wrapper").getBoundingClientRect().height
  );

  document.querySelector(".sidebar").style.maxHeight = height + "rem";
}

function convertPixelsToRem(px) {
  return (
    px /
    parseFloat(
      getComputedStyle(document.documentElement).fontSize.replace("px", "")
    )
  );
}

//synonyms & antonyms
function addLinkedRelatedWords(html, wordsList) {
  let tag;
  if (wordsList[0] == undefined) {
    html.parentElement.style.display = "none";
    html.innerHTML = "";
  } else {
    html.parentElement.style.display = "block";
    html.innerHTML = "";
    for (index = 0; index < wordsList.length; index++) {
      tag = `<span onclick="search('${wordsList[index]}')">${wordsList[index]},</span>`;
      html.insertAdjacentHTML("beforeend", tag);
    }
  }
}

function search(word) {
  searchInput.value = word;
  apiSearch(word);
}

function apiSearch(word) {
  wrapper.classList.remove("active");
  infoText.style.color = "#000";
  infoText.innerHTML = `Searching the meaning of <span>"${word}"</span>`;
  fetchApi(word)
    .then((responseJSON) => {
      data(responseJSON);
    })
    .catch((err) => {
      console.log(err);
    });
}

function fetchApi(word) {
  let url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
  return fetch(url).then((response) => {
    if (response.ok) {
      return response.json();
    }
    infoText.innerHTML = `Information of <span>"${word}"</span> not found. Please, search for another word.`;
    throw new Error("Failed getting JSON response");
  });
}

searchInput.addEventListener("keyup", (e) => {
  let word = e.target.value.replace(/\s+/g, " ");
  if (e.key == "Enter" && word) {
    search(word);
  }
});

volume.addEventListener("click", () => {
  volume.style.color = "#4D59FB";
  audio.play();
  setTimeout(() => {
    volume.style.color = "#999";
  }, 800);
});

removeIcon.addEventListener("click", () => {
  searchInput.value = "";
  searchInput.focus();
  wrapper.classList.remove("active");
  infoText.style.color = "#9A9A9A";
  infoText.innerHTML = "";
  setSidebarHeight();
});

function getWordListData(list) {
  let wordListData = [];

  list.map((word) => {
    let result = new Promise((resolve, reject) => {
      resolve(
        fetchApi(word)
          .then((responseJSON) => {
            var wordInput = getData(responseJSON);
            return wordInput;
          })
          .catch((err) => {
            console.log(err);
          })
      );
    });

    wordListData.push(result);
  });

  return Promise.all(wordListData);
}

function getData(result) {
  let wordInput = {
    Word: result[0].word,
    PartOfSpeech: result[0].meanings[0].partOfSpeech,
  };

  //Sometimes the array is empty/null so "text" can't be retrieved.
  if (result[0].phonetics[0] != undefined) {
    wordInput.Phonetics = result[0].phonetics[0].text;
  } else {
    wordInput.Phonetics = "";
  }

  wordInput.Meanings = result[0].meanings[0].definitions;
  wordInput.Synonyms = result[0].meanings[0].synonyms;
  wordInput.Antonyms = result[0].meanings[0].antonyms;

  return wordInput;
}

function responseToObject(response) {
  let parsed = JSON.stringify(response);
  let object = JSON.parse(parsed);

  return object;
}

function postDataRequest(url) {
  let xmlhttp = new XMLHttpRequest(); // new HttpRequest instance
  xmlhttp.open("POST", url, true);

  // Set the request format
  xmlhttp.setRequestHeader("Accept", "application/json");
  xmlhttp.setRequestHeader("Content-Type", "application/json");

  return xmlhttp;
}

function mapJsonDataToArray(jsonData) {
  jsonData.map((word) => {
    let temp = [];
    word.Meanings.map((meaning) => {
      var newVal = JSON.stringify(meaning);
      temp.push(newVal);
    });
    word.Meanings = temp;
  });
  return { data: jsonData };
}

//*****************************************************************************
//Download button doesn't work on AWS server

// downloadBtn.addEventListener("click", async () => {
//   var url = "/download"; // The backend URL which expects your data

//   var xmlhttp = postDataRequest(url);

//   //When data is recieved from the server
//   xmlhttp.onreadystatechange = function () {
//     if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
//       window.open("/download");
//     }
//   };

//   var jsonData = await getWordListData(list);
//   let dataArray = mapJsonDataToArray(jsonData);

//   // JSON encode the data by stringifying it before sending to the server
//   xmlhttp.send(JSON.stringify(dataArray));
// });

//*****************************************************************************

accountBtn.addEventListener("click", async () => {

  var url = "/login"; // The backend URL which expects your data

  let xmlhttp = new XMLHttpRequest(); // new HttpRequest instance
  xmlhttp.open("POST", url, true);

  // Set the request format
  xmlhttp.setRequestHeader("Accept", "application/text");
  xmlhttp.setRequestHeader("Content-Type", "application/text");

  //When data is recieved from the server
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
      if(accountBtn.innerHTML == "Log in"){
        document.location.href = url;
      }else{
        accountDetail.innerHTML = "No account";
        accountDetail.style.display = "none";
        accountBtn.innerHTML = "Log in";
        localStorage.removeItem('user');
        history.innerHTML = "";
        searchInput.value = "";
        wrapper.classList.remove("active");
        infoText.innerHTML = ``;
      }
    }
  };

  if(accountBtn.innerHTML == "Log in"){
    xmlhttp.send("Login");
  }else{
    xmlhttp.send("Logout");
    
  }
});


