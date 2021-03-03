const { NetworkFirewall } = require("aws-sdk");
const { deserializeUser } = require("passport");

module.exports = (app) => {
  const async = require("async");
  const moment = require("moment");
  const mongoose = require("mongoose");
  const delay = require("delay");
  const User = require("../models/User.js");
  const Store = require("../models/Store.js");
  const Util = require("../models/Util.js");
  const Work = require("../models/Work.js");
  const Car = require("../models/Car.js");
  const isLoggedIn = require("../config/login.js");
  const multer = require("multer");
  const multiparty = require("multiparty");
  const fs = require("fs");
  const AWS = require("aws-sdk");
  const path = require("path");
  const Key = require("../config/Key.js");
  const ID = Key.amazonID;
  const SECRET = Key.amazonSECRET;
  const BUCKET_NAME = Key.amazonBUCKET_NAME;
  const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET,
  });
  /*
const uploadFile = (fileName) => {
  const fileContent = fs.readFileSync(fileName);
  const params = {
    Bucket: BUCKET_NAME,
    Key: moment().valueOf().toString(),
    Body: fileContent,
  };
  s3.upload(params, function (err, data) {
    if (err) {
      throw err;
    }
    console.log("File uploaded successfully", data.Location); //여기서 이 값을 변수에 써야함
  });
};
*/
  app.get("/index", isLoggedIn.isLoggedIn, async (req, res) => {
    try {
      let info_admin = await User.info_admin.findOne({ iu_id: req.user.iu_id });
      info_admin = {
        iu_id: info_admin.iu_id,
      };
      res.render("index.pug", { info_admin: info_admin });
    } catch (err) {
      console.log(err);
    }
  });
  app.get("/", async (req, res) => {
    try {
      return res.redirect("/index");
    } catch (err) {
      console.log(err);
      return res.redirect("/index");
    }
  });
  //가게등록 or 가게목록
  app.get("/store/:type", isLoggedIn.isLoggedIn, async (req, res) => {
    try {
      let info_admin = await User.info_admin.findOne({ iu_id: req.user.iu_id });
      info_admin = {
        iu_id: info_admin.iu_id,
      };
      if (req.params.type == "register") {
        return res.render("StoreRegister.pug", { info_admin: info_admin });
      } else if (req.params.type == "list") {
        //여기서는 검색, 페이지네이션 들어가야함
        let data = await Store.info_store
          .find({
            store_del: 0,
          })
          .sort({ $natural: -1 });
        return res.render("StoreList.pug", {
          info_admin: info_admin,
          data: data,
        });
      }
    } catch (err) {
      console.log(err);
      return res.redirect("/");
    }
  });
  //가게데이터
  app.get("/storedata/:_id", isLoggedIn.isLoggedIn, async (req, res) => {
    //_id값 받는 가게 정보,해당가게의 작업리스트
    //input값에 데이터 넣고, 작업등록버튼, 가게 삭제버튼, 작업리스트 추가
    try {
      let info_admin = await User.info_admin.findOne({ iu_id: req.user.iu_id });
      info_admin = {
        iu_id: info_admin.iu_id,
      };
      let data = await Store.info_store.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(req.params._id),
            store_del: 0,
          },
        },
      ]);
      let work_data = await Work.store_work.aggregate([
        //검색, 페이지네이션 들어가야함
        {
          $match: {
            store_id: mongoose.Types.ObjectId(req.params._id),
            store_work_del: false,
          },
        },
        { $sort: { _id: -1 } },
      ]);
      return res.render("StoreData.pug", {
        info_admin: info_admin,
        data: data[0],
        work_data: work_data,
      });
    } catch (err) {
      console.log(err);
      return res.redirect("/");
    }
  });
  //가게데이터 숨김, 삭제
  app.post("/storedata", isLoggedIn.isLoggedIn, async (req, res) => {
    try {
      if (req.body.type == "hide") {
        await Store.info_store.findOneAndUpdate(
          { _id: mongoose.Types.ObjectId(req.body._id) },
          {
            $set: {
              store_del: 1,
            },
          }
        );
      } else if (req.body.type == "del") {
        await Store.info_store.findOneAndUpdate(
          { _id: mongoose.Types.ObjectId(req.body._id) },
          {
            $set: {
              store_del: 2,
            },
          }
        );
      }
      return res.json("ok");
    } catch (err) {
      console.log(err);
      return res.send(err);
    }
  });
  //가게데이터 저장, 수정
  app.post("/store/:type", isLoggedIn.isLoggedIn, async (req, res) => {
    //수정도 가능하게
    try {
      var form = new multiparty.Form();
      // get field name & value
      let forReviseId;
      let StoreName,
        StoreCEO,
        StoreCEOBirthday,
        sample3_postcode,
        sample3_address,
        sample3_detailAddress,
        sample3_extraAddress,
        lon,
        lat,
        StoreNumber,
        StoreRegisterNumber,
        StoreCategory,
        StoreIntro,
        StoreCostIntro,
        CostOpen,
        StoreHolidayChk,
        StoreBadge;
      //기본 변수들
      let OperationTimeMon = 0,
        OperationTimeTue = 0,
        OperationTimeWen = 0,
        OperationTimeThu = 0,
        OperationTimeFri = 0,
        OperationTimeSat = 0,
        OperationTimeSun = 0;
      let OperationTimeStart1,
        OperationTimeStart2,
        OperationTimeStart3,
        OperationTimeStart4,
        OperationTimeStart5,
        OperationTimeStart6,
        OperationTimeStart7;
      let OperationTimeEnd1,
        OperationTimeEnd2,
        OperationTimeEnd3,
        OperationTimeEnd4,
        OperationTimeEnd5,
        OperationTimeEnd6,
        OperationTimeEnd7;
      let StoreLogoImage, StoreImage, StoreRegisterImage; //이미지 주소 넣을 변수
      let store_labor_cost = [],
        store_operation_time = [],
        OperationTime = [],
        OperationTimeStart = [],
        OperationTimeEnd = [],
        store_closed_day = [],
        store_closed_day_temp = [];
      let laborCost = {},
        holiday = {},
        tmpHoliday = {};
      form.on("field", function (name, value) {
        //값이 추가되어서 오는것들을 처리해야함. 1. 변수에 넣고 값을 굴린다. 2. name값에 변수 잡히면 객체든 배열이든 만들고 추가하고 뿅뿅한다
        if (req.params.type == "revise") {
          if (name == "forReviseId") {
            forReviseId = value;
          }
        }
        if (name == "StoreName") {
          StoreName = value;
        } else if (name == "StoreCEO") {
          StoreCEO = value;
        } else if (name == "StoreCEOBirthday") {
          StoreCEOBirthday = value;
        } else if (name == "sample3_postcode") {
          sample3_postcode = value;
        } else if (name == "sample3_address") {
          sample3_address = value;
        } else if (name == "sample3_detailAddress") {
          sample3_detailAddress = value;
        } else if (name == "sample3_extraAddress") {
          sample3_extraAddress = value;
        } else if (name == "lon") {
          lon = value;
        } else if (name == "lat") {
          lat = value;
        } else if (name == "StoreNumber") {
          StoreNumber = value;
        } else if (name == "StoreRegisterNumber") {
          StoreRegisterNumber = value;
        } else if (name == "StoreCategory") {
          StoreCategory = value;
        } else if (name == "StoreIntro") {
          StoreIntro = value;
        } else if (name == "StoreCostIntro") {
          StoreCostIntro = value;
        } else if (name == "CostOpen") {
          CostOpen = value;
        } else if (name == "StoreHolidayChk") {
          StoreHolidayChk = value;
        } else if (name == "StoreBadge") {
          StoreBadge = value;
        } else {
          if (name.indexOf("laborCost") != -1) {
            //{_id:1604573524408 index:9998 ,type:Number , laborName:String, laborCost1:Number,
            //laborCost2:Number, laborCost:Number} type : 1 가격 범위 type : 2 가격 고정
            if (name.indexOf("laborCostName") != -1) {
              //첫번째 값일때 객체 초기화, 요소 추가
              let make_index = name.replace("laborCostName", "");
              make_index = make_index * 1;
              make_index = 9999 - make_index;
              laborCost = {};
              laborCost._id =
                moment().valueOf().toString() +
                Math.floor(Math.random() * 1000000).toString();
              laborCost.index = make_index;
              laborCost.laborName = value;
            } else if (name.indexOf("laborCostMin") != -1) {
              //Max값이 있어야 Cost1에 넣을지 Cost에 넣을지 확인이 가능 -> 그냥 다 넣어
              laborCost.laborCost = value;
              laborCost.laborCost1 = value;
            } else if (name.indexOf("laborCostMax") != -1) {
              //마지막 값일때 객체 넣고 배열에 객체 추가하기
              if (value) {
                laborCost.type = 1; //범위가격
                laborCost.laborCost2 = value;
              } else {
                laborCost.type = 2; //정해진가격
                laborCost.laborCost2 = 0;
              }
              store_labor_cost.push(laborCost);
            }
          } else if (name.indexOf("OperationTime") != -1) {
            //
            //_id:1608536851994 index:9999 mon:true tue : true wen : true thu : true fri : true
            //sat : true sun : false ampm1 : "am" startTime : "09:00" ampm2 : "pm" endTime : "09:00"}{
            if (name.indexOf("OperationTimeMon") != -1) {
              //몇번째div인지는 몰라
              let make_index = name.replace("OperationTimeMon", "");
              make_index = make_index * 1;
              OperationTimeMon = make_index;
            } else if (name.indexOf("OperationTimeTue") != -1) {
              let make_index = name.replace("OperationTimeTue", "");
              make_index = make_index * 1;
              OperationTimeTue = make_index;
            } else if (name.indexOf("OperationTimeWen") != -1) {
              let make_index = name.replace("OperationTimeWen", "");
              make_index = make_index * 1;
              OperationTimeWen = make_index;
            } else if (name.indexOf("OperationTimeThu") != -1) {
              let make_index = name.replace("OperationTimeThu", "");
              make_index = make_index * 1;
              OperationTimeThu = make_index;
            } else if (name.indexOf("OperationTimeFri") != -1) {
              let make_index = name.replace("OperationTimeFri", "");
              make_index = make_index * 1;
              OperationTimeFri = make_index;
            } else if (name.indexOf("OperationTimeSat") != -1) {
              let make_index = name.replace("OperationTimeSat", "");
              make_index = make_index * 1;
              OperationTimeSat = make_index;
            } else if (name.indexOf("OperationTimeSun") != -1) {
              let make_index = name.replace("OperationTimeSun", "");
              make_index = make_index * 1;
              OperationTimeSun = make_index;
            }
            if (name == "OperationTimeStart1") {
              OperationTimeStart1 = value;
            } else if (name == "OperationTimeStart2") {
              OperationTimeStart2 = value;
            } else if (name == "OperationTimeStart3") {
              OperationTimeStart3 = value;
            } else if (name == "OperationTimeStart4") {
              OperationTimeStart4 = value;
            } else if (name == "OperationTimeStart5") {
              OperationTimeStart5 = value;
            } else if (name == "OperationTimeStart6") {
              OperationTimeStart6 = value;
            } else if (name == "OperationTimeStart7") {
              OperationTimeStart7 = value;
            }
            if (name == "OperationTimeEnd1") {
              OperationTimeEnd1 = value;
            } else if (name == "OperationTimeEnd2") {
              OperationTimeEnd2 = value;
            } else if (name == "OperationTimeEnd3") {
              OperationTimeEnd3 = value;
            } else if (name == "OperationTimeEnd4") {
              OperationTimeEnd4 = value;
            } else if (name == "OperationTimeEnd5") {
              OperationTimeEnd5 = value;
            } else if (name == "OperationTimeEnd6") {
              OperationTimeEnd6 = value;
            } else if (name == "OperationTimeEnd7") {
              OperationTimeEnd7 = value;
            }
          } else if (name.indexOf("holiday") != -1) {
            //{_id : 1604573445980 index: 9999 week : "1" day : "mon"}
            if (name.indexOf("holidayWeek") != -1) {
              //첫번째 값일때 객체 초기화, 요소 추가
              let make_index = name.replace("holidayWeek", "");
              make_index = make_index * 1;
              make_index = 9999 - make_index;
              holiday = {};
              holiday._id =
                moment().valueOf().toString() +
                Math.floor(Math.random() * 1000000).toString();
              holiday.index = make_index;
              holiday.week = value;
            } else if (name.indexOf("holidayDay") != -1) {
              //마지막 값일때 객체 넣고 배열에 객체 추가하기
              holiday.day = value;
              store_closed_day.push(holiday);
            }
          } else if (name.indexOf("tmpHoliday") != -1) {
            // {_id : 1604573445981 index : 9999 startDay : "2020.11.05" endDay : "2020.11.05"}
            if (name.indexOf("tmpHolidayStart") != -1) {
              //첫번째 값일때 객체 초기화, 요소 추가
              let make_index = name.replace("tmpHolidayStart", "");
              make_index = make_index * 1;
              make_index = 9999 - make_index;
              tmpHoliday = {};
              tmpHoliday._id =
                moment().valueOf().toString() +
                Math.floor(Math.random() * 1000000).toString();
              tmpHoliday.index = make_index;
              tmpHoliday.startDay = moment(value, "YYYY-MM-DD").format(
                "YYYY-MM-DD"
              );
            } else if (name.indexOf("tmpHolidayEnd") != -1) {
              //마지막 값일때 객체 넣고 배열에 객체 추가하기
              tmpHoliday.endDay = moment(value, "YYYY-MM-DD").format(
                "YYYY-MM-DD"
              );
              store_closed_day_temp.push(tmpHoliday);
            }
          }
        } //배열에 집어넣어야함
      });
      // file upload handling
      form.on("part", async function (part) {
        var filename;
        var size;
        if (part.filename) {
          filename = part.filename;
          size = part.byteCount;
        } else {
          part.resume();
        }
        var writeStream = fs.createWriteStream("/tmp/" + filename);
        writeStream.filename = filename;
        part.pipe(writeStream);
        part.on("data", function (chunk) {
          console.log(filename + " data " + chunk.length);
        });
        part.on("end", async function () {
          let Bucket_location;
          if (part.name == "StoreLogoImage") {
            Bucket_location =
              "store_logo/" +
              moment().valueOf().toString() +
              Math.floor(Math.random() * 1000000).toString() +
              ".png";
            if (filename) {
              StoreLogoImage =
                "https://motory.s3.ap-northeast-2.amazonaws.com/" +
                Bucket_location;
            }
          } else if (part.name == "StoreImage") {
            Bucket_location =
              "store_bg/" +
              moment().valueOf().toString() +
              Math.floor(Math.random() * 1000000).toString() +
              ".png";
            if (filename) {
              StoreImage =
                "https://motory.s3.ap-northeast-2.amazonaws.com/" +
                Bucket_location;
            }
          } else if (part.name == "StoreRegisterImage") {
            Bucket_location =
              "store_register/" +
              moment().valueOf().toString() +
              Math.floor(Math.random() * 1000000).toString() +
              ".png";
            if (filename) {
              StoreRegisterImage =
                "https://motory.s3.ap-northeast-2.amazonaws.com/" +
                Bucket_location;
            }
          }
          writeStream.end();
          let fileContent = await fs.readFileSync("/tmp/" + filename);
          if (fileContent.length == 0) {
          } else {
            let params = {
              Bucket: BUCKET_NAME,
              Key: Bucket_location,
              Body: fileContent,
            };
            s3.upload(params, function (err, data) {
              if (err) {
                throw err;
              }
              console.log("File uploaded successfully", data.Location); //여기서 이 값을 변수에 써야함
            });
          }
          fs.unlink("/tmp/" + filename, (err) => {
            console.log(err);
          });
          // 모두 업로드되어 변수명 잡히면 함수하나 실행하든 뭐든 해서 DB에 집어넣기
        });
      });
      // all uploads are completed
      form.on("close", async function () {
        OperationTime.push(OperationTimeMon);
        OperationTime.push(OperationTimeTue);
        OperationTime.push(OperationTimeWen);
        OperationTime.push(OperationTimeThu);
        OperationTime.push(OperationTimeFri);
        OperationTime.push(OperationTimeSat);
        OperationTime.push(OperationTimeSun);
        OperationTimeStart.push(OperationTimeStart1);
        OperationTimeStart.push(OperationTimeStart2);
        OperationTimeStart.push(OperationTimeStart3);
        OperationTimeStart.push(OperationTimeStart4);
        OperationTimeStart.push(OperationTimeStart5);
        OperationTimeStart.push(OperationTimeStart6);
        OperationTimeStart.push(OperationTimeStart7);
        OperationTimeEnd.push(OperationTimeEnd1);
        OperationTimeEnd.push(OperationTimeEnd2);
        OperationTimeEnd.push(OperationTimeEnd3);
        OperationTimeEnd.push(OperationTimeEnd4);
        OperationTimeEnd.push(OperationTimeEnd5);
        OperationTimeEnd.push(OperationTimeEnd6);
        OperationTimeEnd.push(OperationTimeEnd7);

        for (var a = 0; a < OperationTime.length; a++) {
          if (OperationTime[a] != 0) {
            //월요일부터 들어갈꺼야
            let make_obj = {};
            make_obj._id =
              moment().valueOf().toString() +
              Math.floor(Math.random() * 1000000).toString();
            make_obj.index = 9999 - (a + 1);
            make_obj.workday = a + 1;
            make_obj.startTime = moment(OperationTimeStart[a], "HHmm").format(
              "HH:mm"
            );
            make_obj.endTime = moment(OperationTimeEnd[a], "HHmm").format(
              "HH:mm"
            );
            store_operation_time.push(make_obj);
          } else {
            //휴일
          }
        }
        if (req.params.type == "register") {
          //등록
          let chk_info_data = await Store.info_store.findOne({
            store_name: StoreName,
            store_ceo: StoreCEO,
            store_ceo_birthday: StoreCEOBirthday,
          });
          if (chk_info_data) {
            return res.send(
              StoreName +
                "," +
                StoreCEO +
                "," +
                StoreCEOBirthday +
                "가 중복되는 데이터가 있습니다. "
            );
          } else {
            await Store.info_store({
              store_user_id:
                moment().valueOf().toString() +
                Math.floor(Math.random() * 1000000).toString(),
              store_name: StoreName,
              store_logo_image: StoreLogoImage,
              store_image: StoreImage,
              store_ceo: StoreCEO,
              store_ceo_birthday: StoreCEOBirthday,
              store_address: sample3_address, //전체 저장하는게 아니라 부분만 저장하자 지도상 주소
              store_address_detail: sample3_detailAddress, //상세주소
              store_post_code: sample3_postcode, //우편번호
              store_address_ref: sample3_extraAddress, //참고사항
              store_register: StoreRegisterNumber,
              store_register_image: StoreRegisterImage,
              store_category: StoreCategory,
              store_info: StoreIntro,
              store_labor_cost: store_labor_cost, //각 배열 원소는 {_id:1604573524408 index:9998 ,type:Number , laborName:String, laborCost1:Number, laborCost2:Number, laborCost:Number} type : 1 가격 범위 type : 2 가격 고정
              store_labor_cost_open: CostOpen,
              store_labor_cost_info: StoreCostIntro,
              store_operation_time: store_operation_time, //각 배열 원소는 {_id:1608536851994 index:9999 mon:true tue : true wen : true thu : true fri : true sat : true sun : false ampm1 : "am" startTime : "09:00" ampm2 : "pm" endTime : "09:00"}
              //이렇게 바꾸면?
              //{_id:1608536851994 index:9999 workday:mon or tue ---  ampm1 : "am" startTime : "09:00" ampm2 : "pm" endTime : "09:00"}
              store_closed_day: store_closed_day, //각 배열 원소는 {_id : 1604573445980 index: 9999 week : "1" day : "mon"} 2번으로 날짜 지우기
              store_closed_day_temp: store_closed_day_temp, //각 배열 원소는 {_id : 1604573445981 index : 9999 startDay : "2020.11.05" endDay : "2020.11.05"} 1번으로 날짜 지우기
              store_holiday: StoreHolidayChk, //공휴일 판별기준??3번으로 날짜 지우기
              store_number: StoreNumber, //가게전화번호
              store_location: { type: "Point", coordinates: [lon, lat] },
              store_badge: StoreBadge,
            }).save();
          }
          return res.send("Upload complete"); //여기서 디비에 저장 후 보내기
        } else if (req.params.type == "revise") {
          //수정 코드 넣기 ->  보내는 아이디값 forReviseId
          let ImageRevise = {};
          if (StoreLogoImage) {
            ImageRevise.store_logo_image = StoreLogoImage;
          }
          if (StoreImage) {
            ImageRevise.store_image = StoreImage;
          }
          if (StoreRegisterImage) {
            ImageRevise.store_register_image = StoreRegisterImage;
          }
          if (Object.keys(ImageRevise).length > 0) {
            let findData = await Store.info_store.findOneAndUpdate(
              {
                _id: mongoose.Types.ObjectId(forReviseId),
              },
              { $set: ImageRevise }
            );
          }
          await Store.info_store.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(forReviseId) },
            {
              $set: {
                store_name: StoreName,
                store_ceo: StoreCEO,
                store_ceo_birthday: StoreCEOBirthday,
                store_address: sample3_address, //전체 저장하는게 아니라 부분만 저장하자 지도상 주소
                store_address_detail: sample3_detailAddress, //상세주소
                store_post_code: sample3_postcode, //우편번호
                store_address_ref: sample3_extraAddress, //참고사항
                store_register: StoreRegisterNumber,
                store_category: StoreCategory,
                store_info: StoreIntro,
                store_labor_cost: store_labor_cost, //각 배열 원소는 {_id:1604573524408 index:9998 ,type:Number , laborName:String, laborCost1:Number, laborCost2:Number, laborCost:Number} type : 1 가격 범위 type : 2 가격 고정
                store_labor_cost_open: CostOpen,
                store_labor_cost_info: StoreCostIntro,
                store_operation_time: store_operation_time, //각 배열 원소는 {_id:1608536851994 index:9999 mon:true tue : true wen : true thu : true fri : true sat : true sun : false ampm1 : "am" startTime : "09:00" ampm2 : "pm" endTime : "09:00"}
                //이렇게 바꾸면?
                //{_id:1608536851994 index:9999 workday:mon or tue ---  ampm1 : "am" startTime : "09:00" ampm2 : "pm" endTime : "09:00"}
                store_closed_day: store_closed_day, //각 배열 원소는 {_id : 1604573445980 index: 9999 week : "1" day : "mon"} 2번으로 날짜 지우기
                store_closed_day_temp: store_closed_day_temp, //각 배열 원소는 {_id : 1604573445981 index : 9999 startDay : "2020.11.05" endDay : "2020.11.05"} 1번으로 날짜 지우기
                store_holiday: StoreHolidayChk, //공휴일 판별기준??3번으로 날짜 지우기
                store_number: StoreNumber, //가게전화번호
                store_location: { type: "Point", coordinates: [lon, lat] },
                store_badge: StoreBadge,
              },
            }
          );
          return res.send("UpDate complete"); //여기서 디비에 저장 후 보내기
        }
      });
      form.parse(req);
    } catch (err) {
      console.log(err);
      return res.redirect("/");
    }
  });
  //작업등록페이지로 or 작업리스트로
  app.get("/work/:type/:_id", isLoggedIn.isLoggedIn, async (req, res) => {
    try {
      let info_admin = await User.info_admin.findOne({ iu_id: req.user.iu_id });
      info_admin = {
        iu_id: info_admin.iu_id,
      };
      let store_data = await Store.info_store.findOne({
        _id: mongoose.Types.ObjectId(req.params._id),
        store_del: 0,
      });
      if (req.params.type == "register") {
        return res.render("WorkRegister.pug", {
          info_admin: info_admin,
          store_data: store_data,
        });
      } else if (req.params.type == "list") {
        //필요할까??
        //여기서는 검색, 페이지네이션 들어가야함
        return res.render("WorkList.pug", {
          info_admin: info_admin,
          data: data,
        });
      }
    } catch (err) {
      console.log(err);
      return res.redirect("/");
    }
  });
  //작업등록 summernote이미지등록
  app.post("/work/:type", isLoggedIn.isLoggedIn, async (req, res) => {
    try {
      if (req.params.type == "image") {
        //이미지파일이 올라가면 data.location잡아서 html코드로 만들어서 쏴주기
        var form = new multiparty.Form();
        let Bucket_location;
        var uploadComplete = 0;
        form.on("part", async function (part) {
          var filename;
          var size;
          if (part.filename) {
            filename = part.filename;
            size = part.byteCount;
          } else {
            part.resume();
          }
          var writeStream = fs.createWriteStream("/tmp/" + filename);
          writeStream.filename = filename;
          part.pipe(writeStream);
          part.on("data", function (chunk) {
            console.log(filename + " data " + chunk.length);
          });
          part.on("end", async function () {
            Bucket_location =
              "Work_image/" +
              moment().valueOf().toString() +
              Math.floor(Math.random() * 1000000).toString() +
              ".png";
            writeStream.end();
            let fileContent;
            let timeChk = 0;
            try {
              fileContent = await fs.readFileSync("/tmp/" + filename);
            } catch (err) {
              try {
                await delay(1000);
                timeChk++;
                fileContent = await fs.readFileSync("/tmp/" + filename);
              } catch (err) {
                fileContent = [];
              }
            }

            if (fileContent.length == 0) {
              uploadComplete = 1;
            } else {
              let params = {
                Bucket: BUCKET_NAME,
                Key: Bucket_location,
                Body: fileContent,
              };
              s3.upload(params, function (err, data) {
                if (err) {
                  throw err;
                }
                uploadComplete = 1;
                console.log("File uploaded successfully", data.Location); //여기서 이 값을 변수에 써야함
              });
            }
            fs.unlink("/tmp/" + filename, (err) => {
              console.log(err);
            });
            //모두 업로드되어 변수명 잡히면 함수하나 실행하든 뭐든 해서 DB에 집어넣기
          });
        });

        form.on("close", async function () {
          while (uploadComplete == 0) {
            await delay(100);
          }
          return res.json({
            success: "Updated Successfully",
            url:
              "https://motory.s3.ap-northeast-2.amazonaws.com/" +
              Bucket_location,
          });
        });
        form.parse(req);
      }
    } catch (err) {
      console.log(err);
      return res.json(err);
    }
  });
  //거리순으로 찾아보기
  app.get("/geo", isLoggedIn.isLoggedIn, async function (req, res) {
    try {
      let data = await Store.info_store.aggregate([
        {
          $geoNear: {
            spherical: true, //true -> $nearSphere 방식으로 구형 지형을 계산
            maxDistance: 1000000, //최대거리 미터단위
            near: {
              type: "Point",
              coordinates: [126.83334, 35.17811],
            },
            distanceField: "distance", //거리가 나올 필드명
            key: "store_location", //인덱스가 설정된 필드명
          },
        }, //리미트는 따로 빼서 해야됨
      ]);

      // let data = await Store.info_store.find({
      //   store_location: {
      //     $nearSphere: {
      //       $geometry: {
      //         type: "Point",
      //         coordinates: [126, 35],
      //       },
      //       $minDistance: 10,//단위는 미터
      //       $maxDistance: 1000000,
      //     },
      //   },
      // });
      return res.json(data);
    } catch (err) {
      console.log(err);
      return res.send(err);
    }
  });
  //작업등록 작업종류 찾기
  app.get("/workfind", isLoggedIn.isLoggedIn, async function (req, res) {
    try {
      let find_query = {};
      let workData = [];
      let workData2 = [];
      if (req.query.work_type) {
        find_query = {
          work_type: req.query.work_type,
        };
        workData = await Work.info_work
          .find(find_query)
          .select(
            "work_type work_type_name work_sub_type_id work_sub_type_name"
          );
        let chk_data2 = workData.reduce((prev, now) => {
          if (
            !prev.some((obj) => obj.work_sub_type_id === now.work_sub_type_id)
          ) {
            prev.push(now);
          }
          return prev;
        }, []);
        workData = chk_data2;
        return res.json(workData);
      } else if (req.query.work_sub_type_name) {
        find_query = {
          work_sub_type_name: req.query.work_sub_type_name,
        };
        workData2 = await Work.info_work.find(find_query);
        return res.json(workData2);
      } else {
        return res.render("workfind.pug");
      }
    } catch (err) {
      console.log(err);
      return res.redirect("/");
    }
  });
  //작업등록 차종찾기
  app.get("/carfind", isLoggedIn.isLoggedIn, async function (req, res) {
    try {
      let carData_brand = [];
      let carData_brand2 = [];
      //국산차
      carData_brand = await Car.info_brand
        .find({ brand_type: 1, view_type: 1 })
        .sort({ view_sort: 1 });
      //수입차
      carData_brand2 = await Car.info_brand
        .find({ brand_type: 2, view_type: 1 })
        .sort({ view_sort: 1 });

      return res.render("carfind.pug", {
        carData_brand: carData_brand,
        carData_brand2: carData_brand2,
      });
    } catch (err) {
      console.log(err);
      return res.redirect("/");
    }
  });
  //작업등록 차종찾기 - 차량데이터검색
  app.get("/cardata", isLoggedIn.isLoggedIn, async function (req, res) {
    try {
      let carData_model = [];
      let carData_model_detail = [];
      //선택한 값에 따른 차종가져오기
      if (req.query.model && req.query.brand) {
        carData_model_detail = await Car.info_car.find({
          brand: req.query.brand,
          model: req.query.model,
          view_type: 1,
        });
        let chk_data2 = carData_model_detail.reduce((prev, now) => {
          if (
            !prev.some((obj) => obj.model_detail_id === now.model_detail_id)
          ) {
            prev.push(now);
          }
          return prev;
        }, []);
        carData_model_detail = chk_data2;
        return res.json(carData_model_detail);
      }
      if (req.query.brand) {
        if (req.query.brand == "쉐보레 대우") {
          req.query.brand = "쉐보레";
        }
        carData_model = await Car.info_car.find({
          brand: req.query.brand,
          view_type: 1,
        });
        let chk_data2 = carData_model.reduce((prev, now) => {
          if (!prev.some((obj) => obj.model_id === now.model_id)) {
            prev.push(now);
          }
          return prev;
        }, []);
        carData_model = chk_data2;
        return res.json(carData_model);
      }
    } catch (err) {
      console.log(err);
      return res.json("g");
    }
  });
  //작업등록 데이터받기
  app.post("/workdata/:type", isLoggedIn.isLoggedIn, async function (req, res) {
    try {
      if (req.params.type == "register" || req.params.type == "revise") {
        var form = new multiparty.Form();
        var fileArray = [];
        let workName, //그대로저장
          workCategory, //중복가능 저장을 하지는...
          workCategoryId = [], //중복가능 아이디값
          store_info_work_type = "",
          //store_info_work_type  으로 작업종류의 대분류 저장. -> String형
          carFinder, //중복가능 저장을 하지는...
          carFinderId = [], //중복가능 아이디값
          requireTime, //00시간00분
          requireDay, //1 2 3
          workCost, //숫자
          laborCost = 0, //숫자
          store_id, //가게의 _id값 ObjectId
          work_id, //작업의 _id값 ObjectId
          store_work_cost_open, //공임가격 공개여부 true false
          summernote; //통으로 저장 String
        let store_info_work_middle = []; //작업종류 중분류
        //태그 빠졌음. 나중에 추가할듯
        form.on("field", function (name, value) {
          if (name == "workName") {
            workName = value;
          } else if (name == "workCategory") {
            workCategory = value;
          } else if (name == "workCategoryId") {
            if (value.indexOf("//") != -1) {
              value = value.split("//");
              for (var a = 0; a < value.length; a++) {
                if (value[a].length > 1) {
                  workCategoryId.push(value[a]);
                }
              }
            } else {
              //하나 선택
              workCategoryId.push(value);
            }
          } else if (name == "carFinder") {
            carFinder = value;
          } else if (name == "carFinderId") {
            if (value) {
              if (value.indexOf("//") != -1) {
                value = value.split("//");
                for (var a = 0; a < value.length; a++) {
                  if (value[a].length > 1) {
                    carFinderId.push(value[a]);
                  }
                }
              } else {
                //하나 선택
                carFinderId.push(value);
              }
            } else {
              carFinderId.push("all");
            }
          } else if (name == "requireTime") {
            requireTime = value;
          } else if (name == "requireDay") {
            requireDay = value;
          } else if (name == "workCost") {
            workCost = value;
          } else if (name == "laborCost") {
            if (value) {
              laborCost = value;
            }
            if (laborCost == 0) {
              store_work_cost_open = false;
            } else {
              store_work_cost_open = true;
            }
          } else if (name == "summernote") {
            summernote = value;
          } else if (name == "store_id") {
            store_id = value;
          } else if (name == "work_id") {
            work_id = value;
          }
        });
        // file upload handling
        form.on("part", async function (part) {
          var filename;
          var size;
          if (part.filename && part.filename != undefined) {
            filename = part.filename;
            size = part.byteCount;
          } else {
            part.resume();
          }
          var writeStream = fs.createWriteStream("/tmp/" + filename);
          writeStream.filename = filename;
          part.pipe(writeStream);
          part.on("data", function (chunk) {
            console.log(filename + " data " + chunk.length);
          });
          part.on("end", async function () {
            if (size > 0) {
              let Bucket_location;
              Bucket_location =
                "Work_thumbnail/" +
                moment().valueOf().toString() +
                Math.floor(Math.random() * 1000000).toString() +
                ".png";
              fileArray.push(
                "https://motory.s3.ap-northeast-2.amazonaws.com/" +
                  Bucket_location
              );
              writeStream.end();
              let fileContent = await fs.readFileSync("/tmp/" + filename);
              if (fileContent.length == 0) {
              } else {
                let params = {
                  Bucket: BUCKET_NAME,
                  Key: Bucket_location,
                  Body: fileContent,
                };
                s3.upload(params, function (err, data) {
                  if (err) {
                    throw err;
                  }
                  console.log("File uploaded successfully", data.Location); //여기서 이 값을 변수에 써야함
                });
              }
            }
            fs.unlink("/tmp/" + filename, (err) => {
              console.log(err);
            });
            //모두 업로드되어 변수명 잡히면 함수하나 실행하든 뭐든 해서 DB에 집어넣기
          });
        });
        // all uploads are completed
        form.on("close", async function () {
          requireTime = moment(requireTime, "HHmm").format("HH시간mm분");
          if (workCategoryId.length > 0) {
            for (var a = 0; a < workCategoryId.length; a++) {
              let workData = await Work.info_work.findOne({
                _id: mongoose.Types.ObjectId(workCategoryId[a]),
              });
              if (workData) {
                if (store_info_work_type.indexOf(workData.work_type) != -1) {
                  //있으면
                } else {
                  store_info_work_type =
                    store_info_work_type + workData.work_type;
                }
                if (
                  store_info_work_middle.includes(workData.work_sub_type_name)
                ) {
                } else {
                  store_info_work_middle.push(workData.work_sub_type_name);
                }
              }
            }
          }
          if (req.params.type == "register") {
            let chk_data = await Work.store_work.findOne({
              store_id: mongoose.Types.ObjectId(store_id),
              store_work_name: workName,
              store_work_time: requireTime,
              store_work_need_day: requireDay,
            });
            if (chk_data) {
              return res.json({ fail: "중복데이터있음" });
            } else {
              
              let StoreData = await Store.info_store.findOne({_id:mongoose.Types.ObjectId(store_id)})
              await Work.store_work({
                store_id: mongoose.Types.ObjectId(store_id), //info_store의 _id값
                //store_user_id: { type: String },
                store_thumbnail: fileArray, //썸네일사진 uri
                store_work_name: workName, //작업명
                store_info_work_type: store_info_work_type, //작업종류 대분류
                store_info_work_middleCategory: store_info_work_middle,
                store_info_work: workCategoryId, //작업종류 info_work의 _id값
                store_info_car: carFinderId, //작업 차량 info_car의 _id값
                store_work_time: requireTime, //작업시간
                store_work_need_day: requireDay, //최소예약날짜
                store_work_total_cost: workCost, //작업 총 가격
                store_work_labor_cost: laborCost, //작업 총 가격중 공임가격
                store_work_cost_open: store_work_cost_open, //true ->공임가격 공개 false -> 총가격만 표시
                store_work_info: summernote, //작업 설명
                //store_work_stop: { type: Boolean }, //일시정지여부
                //store_work_stopdate: { type: Date }, //일시정지시간
                //store_work_del: { type: Boolean, default: false }, //삭제
                //store_work_deldate: { type: Date }, //삭제
                //store_work_tag: { type: Array },
                store_work_regdate: moment(), //등록시간
                //store_work_revisedate: { type: Date }, //수정시간
                //store_work_grade: { type: Number }, //평균평점
                store_location : StoreData.store_location
              }).save();
              return res.redirect("/storedata/" + store_id);
            }
          } else if (req.params.type == "revise") {
            if (fileArray.length > 0) {
              let chk_data = await Work.store_work.findOneAndUpdate(
                {
                  _id: mongoose.Types.ObjectId(work_id),
                },
                {
                  $set: {
                    store_thumbnail: fileArray, //썸네일사진 uri
                    store_work_name: workName, //작업명
                    store_info_work_type: store_info_work_type, //작업종류 대분류
                    store_info_work_middleCategory: store_info_work_middle,
                    store_info_work: workCategoryId, //작업종류 info_work의 _id값
                    store_info_car: carFinderId, //작업 차량 info_car의 _id값
                    store_work_time: requireTime, //작업시간
                    store_work_need_day: requireDay, //최소예약날짜
                    store_work_total_cost: workCost, //작업 총 가격
                    store_work_labor_cost: laborCost, //작업 총 가격중 공임가격
                    store_work_cost_open: store_work_cost_open, //true ->공임가격 공개 false -> 총가격만 표시
                    store_work_info: summernote, //작업 설명
                    //store_work_stop: { type: Boolean }, //일시정지여부
                    //store_work_stopdate: { type: Date }, //일시정지시간
                    //store_work_del: { type: Boolean, default: false }, //삭제
                    //store_work_deldate: { type: Date }, //삭제
                    //store_work_tag: { type: Array },
                    //store_work_regdate: moment(), //등록시간
                    store_work_revisedate: moment(), //수정시간
                    //store_work_grade: { type: Number }, //평균평점
                  },
                }
              );
            } else {
              let chk_data = await Work.store_work.findOneAndUpdate(
                {
                  _id: mongoose.Types.ObjectId(work_id),
                },
                {
                  $set: {
                    //store_user_id: { type: String },
                    //store_thumbnail: fileArray, //썸네일사진 uri
                    store_work_name: workName, //작업명
                    store_info_work_type: store_info_work_type, //작업종류 대분류
                    store_info_work_middleCategory: store_info_work_middle,
                    store_info_work: workCategoryId, //작업종류 info_work의 _id값
                    store_info_car: carFinderId, //작업 차량 info_car의 _id값
                    store_work_time: requireTime, //작업시간
                    store_work_need_day: requireDay, //최소예약날짜
                    store_work_total_cost: workCost, //작업 총 가격
                    store_work_labor_cost: laborCost, //작업 총 가격중 공임가격
                    store_work_cost_open: store_work_cost_open, //true ->공임가격 공개 false -> 총가격만 표시
                    store_work_info: summernote, //작업 설명
                    //store_work_stop: { type: Boolean }, //일시정지여부
                    //store_work_stopdate: { type: Date }, //일시정지시간
                    //store_work_del: { type: Boolean, default: false }, //삭제
                    //store_work_deldate: { type: Date }, //삭제
                    //store_work_tag: { type: Array },
                    //store_work_regdate: moment(), //등록시간
                    store_work_revisedate: moment(), //수정시간
                    //store_work_grade: { type: Number }, //평균평점
                  },
                }
              );
            }
            return res.redirect("/workdata?_id=" + work_id);
          }
        });
        form.parse(req);
      } else {
        if (req.params.type == "stop") {
          //일시정지
          if (req.body._id) {
            await Work.store_work.findOneAndUpdate(
              {
                _id: mongoose.Types.ObjectId(req.body._id),
              },
              {
                $set: {
                  store_work_stop: true,
                  store_work_stopdate: moment(),
                },
              }
            );
          }
        } else if (req.params.type == "del") {
          //삭제
          if (req.body._id) {
            await Work.store_work.findOneAndUpdate(
              {
                _id: mongoose.Types.ObjectId(req.body._id),
              },
              {
                $set: {
                  store_work_del: true,
                  store_work_deldate: moment(),
                },
              }
            );
          }
        } else if (req.params.type == "open") {
          //일시정지 해제
          if (req.body._id) {
            await Work.store_work.findOneAndUpdate(
              {
                _id: mongoose.Types.ObjectId(req.body._id),
              },
              {
                $set: {
                  store_work_stop: false,
                  store_work_opendate: moment(),
                },
              }
            );
          }
        }
        return res.json({ message: "ok" });
      }
    } catch (err) {
      console.log(err);
      return res.json({ error: err });
    }
  });
  app.get("/workdata", isLoggedIn.isLoggedIn, async function (req, res) {
    try {
      let info_admin = await User.info_admin.findOne({ iu_id: req.user.iu_id });
      info_admin = {
        iu_id: info_admin.iu_id,
      };
      let data = {};
      let work_data_string = "";
      let work_data_id = "";
      let car_data_string = "";
      let car_data_id = "";
      if (req.query._id) {
        data = await Work.store_work.findOne({
          _id: mongoose.Types.ObjectId(req.query._id),
        });
        if (data.store_info_work.length > 0) {
          for (var a = 0; a < data.store_info_work.length; a++) {
            let find_data = await Work.info_work.findOne({
              _id: mongoose.Types.ObjectId(data.store_info_work[a]),
            });
            if (a - 1 == data.store_info_work.length) {
              work_data_string += find_data.store_work_name;
              work_data_id += find_data._id + "//";
            } else {
              work_data_string += find_data.work_name + ",";
              work_data_id += find_data._id + "//";
            }
          }
          for (var b = 0; b < data.store_info_car.length; b++) {
            if (data.store_info_car[b] == "all") {
              continue;
            }
            let find_data = await Car.info_car.findOne({
              _id: mongoose.Types.ObjectId(data.store_info_car[b]),
            });
            car_data_string += find_data.model_detail;
            if (b - 1 == data.store_info_car.length) {
              car_data_string += find_data.model_detail;
              car_data_id += find_data._id + "//";
            } else {
              car_data_string += find_data.model_detail + ",";
              car_data_id += find_data._id + "//";
            }
          }
        }
      }
      return res.render("workdata.pug", {
        info_admin: info_admin,
        data: data,
        work_data_string: work_data_string,
        work_data_id: work_data_id,
        car_data_string: car_data_string,
        car_data_id: car_data_id,
      });
    } catch (err) {
      console.log(err);
      return res.redirect("/");
    }
  });
};
