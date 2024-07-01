const router = require("express").Router();
const Course = require("../models").course;
const courseValidation = require("../validation").courseValidation;

router.use((req, res, next) => {
  console.log("course route正在接受一個request");
  next();
});

//獲得系統中的所有課程
router.get("/", async (req, res) => {
  try {
    //可以觀察到回傳的課程中, instructor是講師在MongoDB給的id, 而為了要讓這個id去跟User model中的user做關聯, 可以使用populate()這個method, 第二個參數中的Array就是放要找到哪些關聯的資料
    //注意, populate()是mongoose的query object才能使用的Method, 所以這邊不該先加.exec(), 而是要加在populate()的後面
    //找到的結果可參考圖片
    let foundCourse = await Course.find({})
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(foundCourse);
  } catch (e) {
    return res.status(500).send(e);
  }
});

//用課程id尋找課程
router.get("/:_id", async (req, res) => {
  try {
    let courseFound = await Course.findOne({ _id: req.params })
      .populate("instructor", ["email"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

//講師新增課程
router.post("/", async (req, res) => {
  //驗證資料是否符合規範
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  if (req.user.isStudent()) {
    return res
      .status(400)
      .send("只有講師可以發佈新課程，若您已是講師，請透過講師帳號登入。");
  }
  let { title, description, price } = req.body;
  try {
    let newCourse = new Course({
      title: title,
      description: description,
      price: price,
      instructor: req.user._id,
    });
    let saveCourse = await newCourse.save();
    return res.send({
      message: "新課程已經保存",
      saveCourse,
    });
  } catch (e) {
    return res.status(500).send("無法創建課程!");
  }
});

//更改課程
router.patch("/:_id", async (req, res) => {
  //先驗證資料是否符合規範
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  //確認課程是否存在
  try {
    let courseFound = await Course.findOne({ _id: req.params });
    //console.log(courseFound);
    if (!courseFound) return res.status(400).send("該課程不存在");

    //使用者必須是此課程的講師, 才能編輯課程
    if (courseFound.instructor.equals(req.user._id)) {
      //console.log(req.user);
      let updatedCourse = await Course.findOneAndUpdate(
        { _id: req.params },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );
      return res.send({
        message: "課程更新成功",
        updatedCourse,
      });
    } else {
      return res.status(403).send("只有該課程的講師可以編輯課程");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

router.delete("/:_id", async (req, res) => {
  try {
    let courseFound = await Course.findOne({ _id: req.params });
    //console.log(courseFound);
    if (!courseFound)
      return res.status(400).send("該課程不存在, 無法刪除該課程");

    //使用者必須是此課程的講師, 才能刪除該課程
    if (courseFound.instructor.equals(req.user._id)) {
      await Course.deleteOne({ _id: req.params }).exec();
      return res.send("課程已被刪除");
    } else {
      return res.status(403).send("只有該課程的講師可以刪除課程");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

module.exports = router;
