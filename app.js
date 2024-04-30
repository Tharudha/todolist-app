//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
//const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

mongoose.connect('mongodb+srv://tharudha:tharudha@cluster0.iw3iujr.mongodb.net/todolistDB');
// mongosh "mongodb+srv://cluster0.iw3iujr.mongodb.net/" --apiVersion 1 --username timcryptoo

const itemsSchema = {
  name : String
};

const Item = mongoose.model("Item" , itemsSchema);

const item1 = new Item({
  name : "Welcome to your todolist!"
});
const item2 = new Item({
  name : "Hit the + button to add a new item."
});
const item3 = new Item({
  name : "<-- Hit This to delete an item."
});

const defaultItems = [item1, item2, item3];
// CREATE CUSTOM LISTING USING EXPRESS
const listSchema = {
  name: String,
  items : [itemsSchema]
};
// CREATE CUSTOM LISTING USING EXPRESS
const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  Item.find().then(function(foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems)
        .then(function() {
          console.log("Successfully saved default items to DB");
          return Item.find(); // After inserting, find the items again
        })
        .then(function(newFoundItems) {
          res.render("list", { listTitle: "Today", newListItems: newFoundItems });
        })
        .catch(function(err) {
          console.log(err);
          res.status(500).send("Error occurred while saving default items to DB");
        });
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  }).catch(function(err) {
    console.log(err);
    res.status(500).send("Error occurred while fetching items from DB");
  });
});

// CREATE CUSTOM LISTING USING EXPRESS
// app.get("/:customListName", function(req, res) {
//   const customListName = req.params.customListName;
//
//   List.findOne({ name: customListName }, function(err, foundList) {
//     if (!err) {
//       if (!foundList) {
//         const newList = new List({
//           name: customListName,
//           items: defaultItems
//         });
//         newList.save();
//         res.redirect("/" + customListName);
//       } else {
//         res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
//       }
//     } else {
//       console.error("Error finding list:", err);
//       res.status(500).send("Error finding list");
//     }
//   });
// });
// CREATE CUSTOM LISTING USING EXPRESS
app.get("/:customListName", async function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });
    if (!foundList) {
      const newList = new List({
        name: customListName,
        items: defaultItems
      });
      await newList.save();
      return res.redirect("/" + customListName);
    }
    res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
  } catch (err) {
    console.error("Error finding list:", err);
    res.status(500).send("Error finding list");
  }
});



app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name : itemName
  });

  if (listName === "Today") {
    item.save()
      .then(() => res.redirect("/"))
      .catch(err => {
        console.error("Error saving item:", err);
        res.status(500).send("Error saving item");
      });
  } else {
    List.findOne({ name: listName })
      .then(foundList => {
        if (foundList) {
          foundList.items.push(item);
          return foundList.save();
        } else {
          const newList = new List({
            name: listName,
            items: [item]
          });
          return newList.save();
        }
      })
      .then(() => res.redirect("/" + listName))
      .catch(err => {
        console.error("Error saving item to list:", err);
        res.status(500).send("Error saving item to list");
      });
  }
});

//
//   if (req.body.list === "Work") {
//     workItems.push(item);
//     res.redirect("/work");
//   } else {
//     items.push(item);
//     res.redirect("/");
//   }


app.post("/delete", async function(req, res) {
  let checkedItemId = req.body.checkbox.trim();
  let listName = req.body.listName; // Trim whitespace

  if (listName === "Today") {
    try {
      await Item.findByIdAndDelete(checkedItemId);
      console.log("Successfully deleted checked item.");
      res.redirect("/");
    } catch (err) {
      console.error("Error deleting checked item:", err);
      // Handle the error appropriately
    }
  } else {
    try {
      const foundList = await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      res.redirect("/" + listName);
    } catch (err) {
      console.error("Error deleting item from list:", err);
      // Handle the error appropriately
    }
  }
});




app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started Successfully on port 3000");
});
