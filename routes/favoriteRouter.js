const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var authenticate = require("../authenticate");
const cors = require("./cors");

const Favorites = require("../models/favorite");

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({ user: req.user._id })
      .populate("user")
      .populate("dishes")
      .then(
        (favorites) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorites);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Favorites.find({ user: req.user._id })
        .populate("user")
        .populate("dishes")
        .then((favorites) => {
          var disheslist = req.body;
          if (favorites != null) {
            for (dish in disheslist) {
              if (favorites.dishes.indexOf(dish._id) === null)
                favorites.dishes.push(dish._id);
            }
            favorites.save().then(
              (favorite) => {
                Favorites.findById(favorite._id)
                  .populate("user")
                  .populate("dishes")
                  .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorite);
                  });
              },
              (err) => next(err)
            );
          } else {
            var fav = new Favorites({ user: req.user.id });
            for (dish in disheslist) {
              fav.dishes.push(dish._id);
            }
            Favorites.create(fav).then(
              (favorite) => {
                console.log("Favorites Created ", favorite);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite);
              },
              (err) => next(err)
            );
          }
        })
        .catch((err) => next(err));
    }
  )
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end("PUT operation not supported on /favorites");
    }
  )
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Favorites.remove({ user: req.user._id })
        .then(
          (resp) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(resp);
          },
          (err) => next(err)
        )
        .catch((err) => next(err));
    }
  );

favoriteRouter
  .route("/:dishId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    res.statusCode = 403;
    res.end("GET operation not supported on /favorites/" + req.params.dishId);
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Favorites.find({ user: req.user._id })
        .populate("user")
        .populate("dishes")
        .then((favorites) => {
          if (favorites != null) {
            if (favorites.dishes.indexOf(req.params.dishId) === null) {
              favorites.dishes.push(req.params.dishId);
              favorites.save().then(
                (favorite) => {
                  Favorites.findById(favorite._id)
                    .populate("user")
                    .populate("dishes")
                    .then((favorite) => {
                      res.statusCode = 200;
                      res.setHeader("Content-Type", "application/json");
                      res.json(favorite);
                    });
                },
                (err) => next(err)
              );
            }
            else{
                err = new Error("Dish " + req.params.dishId + "is already a favourite for you");
            err.status = 403;
            return next(err);
            }
          } else {
            var fav = new Favorites({ user: req.user.id });
              fav.dishes.push(req.params.dishId);
            Favorites.create(fav).then(
              (favorite) => {
                console.log("Favorites Created ", favorite);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite);
              },
              (err) => next(err)
            );
          }
        })
        .catch((err) => next(err));
    }
  )
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end("PUT operation not supported on /favorites/" + req.params.dishId);
    }
  )
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Favorites.find({ user: req.user._id })
        .populate("user")
        .populate("dishes")
        .then((favorites) => {
          if (favorites.dishes._id.equals(req.params.dishId)) {
            favorites.dishes.remove(req.params.dishId);
            favorites.save().then(
              (favorite) => {
                Favorites.findById(favorite._id)
                  .populate("user")
                  .populate("dishes")
                  .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorite);
                  });
              },
              (err) => next(err)
            );
          } else {
            err = new Error("Dish " + req.params.dishId + " not found");
            err.status = 403;
            return next(err);
          }
        })
        .catch((err) => next(err));
    }
  );

module.exports = favoriteRouter;
