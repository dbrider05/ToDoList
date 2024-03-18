require('dotenv').config()
const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect(process.env.MongoURL); 

const itemsSchema = {
    name : String
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
    name : "Welcome to your ToDoList"
});

const item2 = new Item({
    name : "Hit the + button to add new item."
});

const item3 = new Item({
    name : "--> hit this to delete an item."
});

const defaultItems = [item1,item2,item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("list",listSchema);

app.get("/", function(req, res){
    Item.find().then(function(foundItems){
        if(foundItems.length === 0){
            Item.insertMany(defaultItems);
            res.redirect("/");
        } 
        else{
        res.render("list", {listTitle:"Today", items : foundItems});
        }
    });
    
});

app.get("/:customListName", function(req,res){
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name:customListName}).then(function(foundList){
        if(!foundList){
            // creating a new list
            const list = new List({
            name: customListName,
            items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
        } else {
            // show the existing list
            res.render("list", {listTitle:foundList.name, items: foundList.items});
        }
    });


});

app.post("/",function(req,res){
    const itemName = req.body.item;
    const listName = req.body.list;
   
    const item = new Item({
        name : itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name : listName}).then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }

});

app.post("/delete",async(req,res)=>{

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName == "Today"){
        await Item.findByIdAndDelete(checkedItemId);
        res.redirect("/");
    } else {
        List.findOneAndUpdate({name:listName},{$pull : {items:{_id:checkedItemId}}}).then(function(foundList){
            res.redirect("/"+listName);
        }); 
    }
});

app.listen(3000, function(req, res){
    console.log("server is running at port 3000.");
});