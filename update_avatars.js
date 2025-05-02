const NEW_AVATAR = "https://instagram.fvlc6-1.fna.fbcdn.net/v/t51.2885-19/21984958_1442763115778809_910840835518496768_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fvlc6-1.fna.fbcdn.net&_nc_cat=101";
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("src/data/mockData.json"));
let counter = 0;

Object.values(data.sellers).forEach(sellers => {
  sellers.forEach(seller => {
    if (seller.id === "business-toma") {
      seller.avatar = NEW_AVATAR;
      counter++;
    }
  });
});

console.log(`Updated ${counter} avatar URLs`);
fs.writeFileSync("src/data/mockData.json", JSON.stringify(data, null, 2)); 