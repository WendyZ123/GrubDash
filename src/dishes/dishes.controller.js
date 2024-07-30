const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res){
  res.json({ data: dishes });
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Dish must include a ${propertyName}` });
    };
  }

function bodyDataIsNotEmpty(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName] != "") {
        return next();
      }
      next({ status: 400, message: `Dish must include a ${propertyName}` });
    };
  }

function bodyDataIsValidInteger(propertyName){
  return function (req, res, next) {
      const { data = {} } = req.body;
      if (Number.isInteger(data[propertyName]) && data[propertyName] >= 0) {
        return next();
      }
      next({ status: 400, message: `Dish must have a ${propertyName} that is an integer greater than 0` });
    };
}

function create(req, res){
  const { data: {name, description, price, image_url} = {}} = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price, 
    image_url,
  };
  dishes.push(newDish);
  
  res.status(201).json({data: newDish});
}

function dishExists(req, res, next){
  const { dishId } = req.params;
  const foundDish = dishes.find(dish => dish.id === dishId);
  if(foundDish){
    res.locals.dish = foundDish;
    return next();
  }
  else {
    next({status: 404, message: `Dish does not exist: ${dishId}.`});
  }
}

function read(req, res){
  res.json({data: res.locals.dish});
}

function dishIdMatches(req, res, next){
  const { data: { id } = {}} = req.body;
  const { dishId } = req.params;
  if(id){
    if(id === dishId){
      return next();
    }
    else {
      next({status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`});
    }
  }
  return next();
}

function update(req, res) {
  const { data: {id, name, description, image_url, price} = {}} = req.body; 
  const dish = res.locals.dish;
  dish.name = name;
  dish.description = description;
  dish.image_url = image_url;
  dish.price = price;
  
  res.json({data: dish});
}

module.exports = {
  list,
  create: [
    bodyDataHas("name"),
    bodyDataIsNotEmpty("name"),
    bodyDataHas("description"),
    bodyDataIsNotEmpty("description"),
    bodyDataHas("price"),
    bodyDataIsValidInteger("price"),
    bodyDataHas("image_url"),
    bodyDataIsNotEmpty("image_url"),
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists, 
    dishIdMatches, 
    bodyDataHas("name"),
    bodyDataIsNotEmpty("name"),
    bodyDataHas("description"),
    bodyDataIsNotEmpty("description"),
    bodyDataHas("price"),
    bodyDataIsValidInteger("price"),
    bodyDataHas("image_url"),
    bodyDataIsNotEmpty("image_url"),
    update],
}
