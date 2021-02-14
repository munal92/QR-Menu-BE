const { Storage } = require("@google-cloud/storage");
const express = require("express");
const router = express.Router();
const UserDB = require("../models/userModel-db");
const checkJWT = require("../auth/restricted-midd.js");
const Multer = require("multer");

/// Config Multer
const multer = Multer({
  storage: Multer.memoryStorage(),
  //   limits: 10000,
  limits: {
    fileSize: 10 * 1024 * 1024, // no larger than 10mb
  },
});

/// Config GCS
const gc = new Storage({
  projectId: process.env.GC_PROJ_ID,
  credentials: {
    client_email: process.env.GC_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GC_CLOUD_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
});

const qrMenuBucket = gc.bucket(process.env.GC_BUCKET_NAME);

/// @GETREQ  get user info by id
router.get("/:id", checkJWT, (req, res) => {
  const { id } = req.params;
  try {
    UserDB.findById(id, (err, user_data) => {
      if (err) {
        console.error(err);
      } else {
        res.status(200).json(user_data);
      }
    });
  } catch (err) {
    res.status(500).json({ errorMessage: "server Error", err });
  }
});

/// @POSTREQ  find login info
router.post("/find", checkJWT, (req, res) => {
  const userInfo = req.body;
  console.log(userInfo);
  try {
    UserDB.findOne({ email: userInfo.email }, (err, user_data) => {
      if (err) {
        console.error(err);
      } else {
        res.status(200).json(user_data);
      }
    });
  } catch (err) {
    res.status(500).json({ errorMessage: "server Error", err });
  }
});

//@PutREQ add files to user
router.put("/addinfo/:id", checkJWT, multer.single("upload"), (req, res) => {
  const { id } = req.params;
  const filename1 =
    new Date().toISOString().replace(/:/g, "-") + req.file.originalname;
  const blob = qrMenuBucket.file(filename1);
  const blobStream = blob.createWriteStream();

  blobStream.on("error", (err) =>
    res.status(500).json({ errorMessage: "Google Cloud server Error", err })
  );

  ///GCS
  blobStream.on("finish", () => {
    let publicURL = `https://storage.googleapis.com/${process.env.GC_BUCKET_NAME}/${blob.name}`;

    const updatedInfo = {
      fileLink: publicURL,
    };
    try {
      //// update DB
      UserDB.findByIdAndUpdate(
        id,
        updatedInfo,
        { new: true, useFindAndModify: false },
        (err, updatedInf) => {
          if (err) {
            res.status(404).json({ errorMessage: "Couldn't update", err });
          } else {
            res.status(200).json(updatedInf);
          }
        }
      );
    } catch (err) {
      res.status(500).json({ errorMessage: "server Error", err });
    }
  });
  blobStream.end(req.file.buffer);
});

//@DeleteREQ delete files of the user
router.put("/delfile/:id", checkJWT, (req, res) => {
  const { id } = req.params;
  const updatedInfo = {
    fileLink: "NONE",
  };
  /// updating user info
  try {
    UserDB.findByIdAndUpdate(
      id,
      updatedInfo,
      { new: true, useFindAndModify: false },
      (err, updatedInf) => {
        if (err) {
          res
            .status(404)
            .json({ errorMessage: "Couldn't delete the file", err });
        } else {
          //Delete the file from google cloud
          let urlArr = req.body.fileLink.split("/"); // getting the file name for delete
          console.log(urlArr[urlArr.length - 1]);
          //console.log(req.body.fileLink);
          // res.status(200).json(updatedInf);
          try {
            qrMenuBucket
              .file(urlArr[urlArr.length - 1])
              .delete()
              .then(() => {
                res.status(200).json(updatedInf);
              })
              .catch(function (err) {
                res.status(500).json({
                  errorMessage: "Couldn't delete/update the file GCS",
                  err,
                });
              });
          } catch (err) {
            res.status(404).json({
              errorMessage: "Error with filelink it might be wrong",
              err,
            });
          }
        }
      }
    );
  } catch (err) {
    res.status(500).json({ errorMessage: "server Error", err });
  }
});

module.exports = router;
