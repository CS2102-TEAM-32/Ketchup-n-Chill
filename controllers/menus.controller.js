const db = require('../db/index');

exports.showMenu = async (req, res, next) => {
  try {
    // find the menu; there should be one menu
    await db.one(
      'SELECT * FROM Menu WHERE title=$1 AND rname=$2 AND raddress=$3',
      [req.params.title, req.params.rname, req.params.raddress]
    );

    // there could be no items in the menu
    const items = await db.any(
      'SELECT fname, price FROM Menu NATURAL JOIN FoodItems WHERE title=$1 AND rname=$2 AND raddress=$3',
      [req.params.title, req.params.rname, req.params.raddress]
    );
    res.render('menu', {
      menu: req.params,
      items
    });
  } catch (e) {
    return res.sendStatus(404);
  }
};

exports.showAddMenuPage = async (req, res, next) => {
  // check whether it belongs to the restaurant owner first
  try {
    await db.one(
      'SELECT * FROM OwnedRestaurants WHERE raddress=$1 AND rname=$2 AND uname=$3',
      [req.params.raddress, req.params.rname, req.user.uname]
    );
  } catch (e) {
    return res.send(401);
  }

  res.render('add-menu', {
    rname: req.params.rname,
    raddress: req.params.raddress
  });
};

exports.addMenu = async (req, res, next) => {
  let xs, menu;

  // processing
  try {
    xs = zip([req.body.item].flat(), [req.body.price].flat()).map(obj => {
      let parsedPrice = parseFloat(obj.price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        throw 'Bad price!';
      }
      obj.price = parsedPrice;
      return obj;
    });
  } catch (e) {
    req.flash(
      'danger',
      'Something went wrong! It might be that I cannot figure out your price.'
    );
    return res.redirect('back');
  }

  // create the new menu
  try {
    menu = await db.one('INSERT INTO Menu VALUES ($1, $2, $3) RETURNING *', [
      req.body.title,
      req.params.rname,
      req.params.raddress
    ]);
  } catch (e) {
    req.flash(
      'danger',
      'Something went wrong! Do you have a similarly named menu already?'
    );
    return res.redirect('back');
  }

  // create new items
  xs.map(obj => {
    return db.one(
      'INSERT INTO FoodItems VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [obj.item, obj.price, menu.title, req.params.rname, req.params.raddress]
    );
  });

  Promise.all(xs)
    .then(() => {
      req.flash('success', 'Success!');
      res.redirect('/home');
    })
    .catch(e => {
      req.flash(
        'Something went wrong... Not all might be added, please check again!'
      );
      res.redirect('back');
    });
};

exports.deleteMenu = async (req, res, next) => {
  try {
    // check whether the menu really belongs to that user
    await db.one(
      'SELECT * FROM OwnedRestaurants NATURAL JOIN Menu WHERE uname=$1 AND raddress=$2 AND rname=$3 AND title=$4',
      [req.user.uname, req.params.raddress, req.params.rname, req.params.title]
    );
    await db.one(
      'DELETE FROM Menu WHERE raddress=$1 AND rname=$2 AND title=$3 RETURNING *',
      [req.params.raddress, req.params.rname, req.params.title]
    );
    req.flash('success', 'Deleted!');
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(401); // unauthorised, if it throws from the first await statement. assume that 2nd never fails.
  }
};

exports.updateMenu = async (req, res, next) => {
  // update a menu of a restaurant
};

/*
 take 2 lists (item and price) of the SAME length, zip them together into 1 list.
 each element in this new list is an object, with fields items and price from
 the initial itemList and priceList.
*/
function zip(itemList, priceList) {
  let final = [];
  itemList.forEach((item, index) => {
    final.push({
      item: item,
      price: priceList[index]
    });
  });
  return final;
}
