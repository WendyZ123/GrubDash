const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res){
  res.json({ data: orders });
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

function DishDataHas(propertyName) {
    return function (req, res, next) {
      const { data: { dishes = [ {} ] } = {}} = req.body;
      dishes.forEach((dish, index) => {
        if(!dish[propertyName]){
          next({ status: 400, message: `dish ${index} must have a quantity that is an integer greater than 0` });
        }
      });
      return next();
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

function bodyDataIsValidArray(propertyName){
  return function (req, res, next) {
    const { data = {} } = req.body;
    if(Array.isArray(data[propertyName]) && data[propertyName].length > 0){
      return next();
    }
    next({ status: 400, message: `Order must include at least one dish`});
  }
}

function DishDataIsValidInteger(propertyName){
  return function (req, res, next) {
      const { data: { dishes = [ {} ] } = {}} = req.body;
       dishes.forEach((dish, index) => {
        if(!Number.isInteger(dish[propertyName]) || dish[propertyName] <= 0){
          next({ status: 400, message: `dish ${index} must have a quantity that is an integer greater than 0` });
        }
      });
      return next();
    };
}

function create(req, res){
  const { data: { deliverTo, mobileNumber, status, dishes: [ { id, name, description, image_url, price, quantity } ] } = {}} = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo, 
    mobileNumber, 
    status,
    dishes: [ { id, name, description, image_url, price, quantity } ] ,
  }
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next){
  const {orderId} = req.params;
  const foundOrder = orders.find(order => order.id === orderId);
  const foundIndex = orders.findIndex(order => order.id === orderId);
  if(foundOrder){
    res.locals.order = foundOrder;
    res.locals.index = foundIndex;
    return next();
  }
  next({status: 404, message: `Order does not exist: ${orderId}.`})
}

function read(req, res) {
  const order = res.locals.order;
  res.json({ data: order });
}

function orderIdMatches(req, res, next){
  const { data: { id } = {}} = req.body;
  const { orderId } = req.params;
  if(id){
    if(id === orderId){
      return next();
    }
    else {
      next({status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`});
    }
  }
  return next();
}

function statusIsValid(req, res, next){
  const { data: { status } = {}} = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if(status && validStatus.includes(status)){
      return next();
  }
  next({status: 400, message: "Order must have a status of pending, preparing, out-for-delivery, delivered"});
}

function DeliveredOrderIsNotChanged(req, res, next){
  const { data: { status } = {}} = req.body;
  const order = res.locals.order;
  if(status === "delivered" && order.status !== status){
    next({status: 400, message: "A delivered order cannot be changed"});
  }
  return next();
}

function update(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes} = {}} = req.body;
  const order = res.locals.order;
  
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes.forEach((dish, index) => {
    dish.id = dishes[index].id;
    dish.name = dishes[index].name;
    dish.description = dishes[index].description;
    dish.image_url = dishes[index].image_url;
    dish.price = dishes[index].price;
    dish.quantity = dishes[index].quantity;
  });
  
  res.json({ data: order});
}

function onlyPendingOrderCouldBeDeleted(req, res, next){
  const order = res.locals.order;
  if(order.status === "pending"){
    return next();
  }
  next({status:400, message: "An order cannot be deleted unless it is pending. "});
}

function destroy(req, res){
  const index = res.locals.index;
  const deletedOrder = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataIsNotEmpty("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataIsNotEmpty("mobileNumber"),
    bodyDataHas("dishes"),
    bodyDataIsValidArray("dishes"),
    DishDataHas("quantity"),
    DishDataIsValidInteger("quantity"),
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    orderIdMatches,
    bodyDataHas("deliverTo"),
    bodyDataIsNotEmpty("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataIsNotEmpty("mobileNumber"),
    bodyDataHas("dishes"),
    bodyDataIsValidArray("dishes"),
    DishDataHas("quantity"),
    DishDataIsValidInteger("quantity"),
    statusIsValid,
    DeliveredOrderIsNotChanged,
    update,
  ],
  delete: [
    orderExists,
    onlyPendingOrderCouldBeDeleted,
    destroy,
  ]
}
