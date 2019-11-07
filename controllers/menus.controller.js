const db = require('../db/index');

exports.showMenu = async (req, res, next) => {
  try {
    // find the menu; there should be one menu
    const restaurantOwner = await db.one(
      'SELECT uname FROM Menu NATURAL JOIN OwnedRestaurants WHERE title=$1 AND rname=$2 AND raddress=$3',
      [req.params.title, req.params.rname, req.params.raddress]
    );

    // there could be no items in the menu
    const items = await db.any(
      'SELECT fname, price FROM Menu NATURAL JOIN FoodItems WHERE title=$1 AND rname=$2 AND raddress=$3',
      [req.params.title, req.params.rname, req.params.raddress]
    );

    if (req.user && req.user.uname === restaurantOwner.uname) { // if logged in and is the restaurant owner
      res.render('edit-menu', {
        menu: req.params,
        items
      });
    } else {
      res.render('menu', {
        menu: req.params,
        items
      })
    }
  } catch (e) {
    return res.sendStatus(404);
  }
};

exports.editMenu = async (req, res, next) => {
  // route should be /edit
  try {
    // check if menu belongs to user
    await db.one(
      'SELECT * FROM Menu NATURAL JOIN OwnedRestaurants WHERE title=$1 AND rname=$2 AND raddress=$3 AND uname=$4',
      [req.params.title, req.params.rname, req.params.raddress, req.user.uname]
    );

    // there could be no items in the menu
    const items = await db.any(
      'SELECT fname, price FROM Menu NATURAL JOIN FoodItems WHERE title=$1 AND rname=$2 AND raddress=$3',
      [req.params.title, req.params.rname, req.params.raddress]
    );

    res.render('edit-menu', {
      menu: req.params,
      items
    });
  } catch (e) {
    return res.sendStatus(401);
  }
};

exports.showAddMenuPage = async (req, res, next) => {
  // check whether it belongs to the restaurant owner first
  try {
    const restaurantPromise = db.one(
      'SELECT * FROM OwnedRestaurants WHERE raddress=$1 AND rname=$2 AND uname=$3',
      [req.params.raddress, req.params.rname, req.user.uname]
    );
    const menusPromise = db.manyOrNone(
      'SELECT * FROM Menu WHERE rname=$1 AND raddress=$2',
      [req.params.rname, req.params.raddress]
    );

    const resolvedPromises = await Promise.all([
      restaurantPromise,
      menusPromise
    ]);
    console.log(resolvedPromises);

    res.render('add-menu', {
      rname: req.params.rname,
      raddress: req.params.raddress,
      menus: resolvedPromises[1]
    });
  } catch (e) {
    console.log(e);
    return res.send(401);
  }
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

  // look for the menu
  try {
    // if there is a menu, add to that
    menu = await db.one(
      'SELECT * FROM Menu WHERE title=$1 AND raddress=$2 AND rname=$3',
      [req.body.title, req.params.raddress, req.params.rname]
    );
  } catch (e) {
    // no menu could be found, a new one should be created
    menu = await db
      .one('INSERT INTO Menu VALUES ($1, $2, $3) RETURNING *', [
        req.body.title,
        req.params.rname,
        req.params.raddress
      ])
      .catch(e => {
        req.flash('danger', 'Something went wrong!');
        return res.redirect('back');
      });
  }

  // create the new menu
  // try {
  //   menu = await db.one('INSERT INTO Menu VALUES ($1, $2, $3) RETURNING *', [
  //     req.body.title,
  //     req.params.rname,
  //     req.params.raddress
  //   ]);
  // } catch (e) {
  //   req.flash(
  //     'danger',
  //     'Something went wrong! Do you have a similarly named menu already?'
  //   );
  //   return res.redirect('back');
  // }

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

exports.updateMenuItem = async (req, res, next) => {
  // need rname, raddress, title, name of the food item
  // req.body: fname, price
  try {
    await db.one(
      'SELECT * FROM OwnedRestaurants NATURAL JOIN Menu NATURAL JOIN FoodItems WHERE uname=$1 AND raddress=$2 AND rname=$3 AND title=$4 AND fname=$5',
      [
        req.user.uname,
        req.params.raddress,
        req.params.rname,
        req.params.title,
        req.params.fname
      ]
    );

    db.one('UPDATE FoodItems SET fname=$1, price=$2 WHERE fname=$3', [
      req.body.fname,
      req.body.price,
      req.params.fname
    ]);

    req.flash('success', 'Updated!');
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(401); // unauthorised. although there could be a case where there does not exist!
  }
};

exports.deleteMenuItem = async (req, res, next) => {
  try {
    await db.one(
      'SELECT * FROM OwnedRestaurants NATURAL JOIN Menu NATURAL JOIN FoodItems WHERE uname=$1 AND raddress=$2 AND rname=$3 AND title=$4 AND fname=$5',
      [
        req.user.uname,
        req.params.raddress,
        req.params.rname,
        req.params.title,
        req.params.fname
      ]
    );

    db.one(
      'DELETE FROM FoodItems WHERE fname=$1 AND raddress=$2 AND rname=$3 AND title=$4 RETURNING *',
      [
        req.params.fname,
        req.params.raddress,
        req.params.rname,
        req.params.title
      ]
    );

    req.flash('success', 'Deleted!');
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(401); // unauthorised. although there could be a case where there does not exist!
  }
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
