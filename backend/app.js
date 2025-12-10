require("dotenv").config();


const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const app = express();
const notFoundMiddleware = require("./app/middlewares/not-found");
const handleErrorMiddleware = require("./app/middlewares/handler-error");

app.use(cookieParser(process.env.JWT_SECRET_KEY));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

require('./app/db/index');

const v1 = "/api/v1";
const authRouter = require("./app/api/v1/auth/router");
const usersRouter = require("./app/api/v1/users/router");
const parentProduct1Router = require("./app/api/v1/parentProduct1/router");
const parentProduct2Router = require("./app/api/v1/parentProduct2/router");
const productRouter = require("./app/api/v1/product/router");
const formsRouter = require("./app/api/v1/forms/router");
const orderRouter = require("./app/api/v1/order/router");
const formFieldsRouter = require("./app/api/v1/formFields/router");

// LMS Routers (New)
const siswaRouter = require("./app/api/v1/siswa/router");
const orangTuaRouter = require("./app/api/v1/orangTua/router");
const siswaKelasRouter = require("./app/api/v1/siswaKelas/router");
const materiButtonRouter = require("./app/api/v1/materiButton/router");
const aksesMateriRouter = require("./app/api/v1/aksesMateri/router");


app.get("/", (req, res) => {
  res.status(200).json({
    message: "Selamat datang di WEB KPM",
  });
});

app.use(`${v1}/cms`, authRouter);
app.use(`${v1}/cms/users`, usersRouter);
app.use(`${v1}/cms`, parentProduct1Router);
app.use(`${v1}/cms`, parentProduct2Router);
app.use(`${v1}/cms`, productRouter);
app.use(`${v1}/cms`, formsRouter);
app.use(`${v1}/cms`, orderRouter);
app.use(`${v1}/cms`, formFieldsRouter);

// LMS Routes (New)
app.use(`${v1}/cms`, siswaRouter);
app.use(`${v1}/cms`, orangTuaRouter);
app.use(`${v1}/cms`, siswaKelasRouter);
app.use(`${v1}/cms`, materiButtonRouter);
app.use(`${v1}/cms`, aksesMateriRouter);

// Error Middleware
app.use(notFoundMiddleware);
app.use(handleErrorMiddleware);

module.exports = app;