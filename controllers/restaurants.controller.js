const db = require('../db/index');

exports.showAllRestaurants = async (req, res, next) => {
    try {
        const restaurants = await db.any('SELECT * FROM OwnedRestaurants');
        res.render('restaurants', {
            title: 'All Restaurants',
            restaurants: restaurants

        });
    } catch (e) {
        next(e);
    }
};

exports.showRestaurantProfile = async (req, res, next) => {
    try {
        const restaurant = await db.one('SELECT * FROM OwnedRestaurants where rname=$1',
            [req.params.rname]);

        res.render('restaurant', {
            restName: restaurant.rname,
            restAddr: restaurant.raddress,
            restaurantOwner: restaurant.uname,
            phoneNum: restaurant.phone_num,
            cuis: restaurant.cuisine,
            openinghr: restaurant.opening_hr,
            closinghr: restaurant.closing_hr
        })

    } catch (e) {
        next(e);
    }
};
